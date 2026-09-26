import { getSql } from "@/lib/sql";

const FINISHED = ["DELIVERED", "CANCELLED", "RTO"] as const;
const RETENTION_DAYS = 90;

export function finishedStatuses(): readonly string[] {
  return FINISHED;
}

export function retentionCutoffIso(): string {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);
  return cutoff.toISOString();
}

/** Deletes finished shipments older than 3 months (and related rows). */
export async function purgeExpiredFinishedShipments(): Promise<number> {
  try {
    const db = await getSql();
    const cutoff = retentionCutoffIso();
    const placeholders = FINISHED.map(() => "?").join(", ");
    const expired = (await db
      .prepare(
        `SELECT id FROM shipments WHERE status IN (${placeholders}) AND updated_at < ?`,
      )
      .all(...FINISHED, cutoff)) as Array<{ id: string }>;
    if (expired.length === 0) return 0;

    await db.transaction(async (tx) => {
      for (const { id } of expired) {
        const invoices = (await tx
          .prepare(`SELECT id FROM commercial_invoices WHERE shipment_id = ?`)
          .all(id)) as Array<{ id: string }>;
        for (const inv of invoices) {
          await tx.prepare(`DELETE FROM commercial_invoice_lines WHERE invoice_id = ?`).run(inv.id);
        }
        await tx.prepare(`DELETE FROM commercial_invoices WHERE shipment_id = ?`).run(id);
        const quotes = (await tx
          .prepare(`SELECT id FROM quotes WHERE shipment_id = ?`)
          .all(id)) as Array<{ id: string }>;
        for (const quote of quotes) {
          await tx.prepare(`DELETE FROM quote_options WHERE quote_id = ?`).run(quote.id);
        }
        await tx.prepare(`DELETE FROM quotes WHERE shipment_id = ?`).run(id);
        await tx.prepare(`DELETE FROM tracking_events WHERE shipment_id = ?`).run(id);
        await tx.prepare(`DELETE FROM exception_cases WHERE shipment_id = ?`).run(id);
        await tx.prepare(`DELETE FROM cod_collections WHERE shipment_id = ?`).run(id);
        await tx.prepare(`DELETE FROM shipments WHERE id = ?`).run(id);
      }
    });
    return expired.length;
  } catch (error) {
    console.error(
      "[shipment-purge.ts:purgeExpiredFinishedShipments]",
      error instanceof Error ? error.message : error,
    );
    return 0;
  }
}
