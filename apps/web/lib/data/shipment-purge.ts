import { getSql } from "@/lib/sql";
import { ensurePaymentsTable } from "@/lib/data/payments";

const FINISHED = ["DELIVERED", "CANCELLED", "RTO"] as const;
const UNBOOKED = ["DRAFT", "QUOTED"] as const;
/** Finished shipments leave the customer's list after this long (they stay in the database). */
const RETENTION_DAYS = 90;
/** Drafts and quotes nobody touched for this long are removed. */
const DRAFT_DAYS = 30;

export function finishedStatuses(): readonly string[] {
  return FINISHED;
}

function daysAgoIso(days: number): string {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}

export function retentionCutoffIso(): string {
  return daysAgoIso(RETENTION_DAYS);
}

/**
 * Deletes abandoned drafts and quotes (never booked, never paid) untouched for 30 days, with
 * their quotes and invoices. Booked, delivered, and cancelled shipments are business records
 * (accounts, disputes, delivery history) and are never deleted here.
 */
export async function purgeAbandonedDrafts(): Promise<number> {
  try {
    await ensurePaymentsTable();
    const db = await getSql();
    const marks = UNBOOKED.map(() => "?").join(", ");
    const abandoned = (await db
      .prepare(
        `SELECT s.id FROM shipments s
         WHERE s.status IN (${marks}) AND s.updated_at < ?
           AND s.hulakico_awb IS NULL
           AND NOT EXISTS (SELECT 1 FROM payment_intents p WHERE p.shipment_id = s.id AND p.status = 'PAID')`,
      )
      .all(...UNBOOKED, daysAgoIso(DRAFT_DAYS))) as Array<{ id: string }>;
    if (abandoned.length === 0) return 0;
    // Some tables are created on first use, so only clear the ones that exist.
    const present = new Set(((await db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all()) as Array<{ name: string }>).map((row) => row.name));
    const linked = ["exception_cases", "cod_collections", "outbound_notifications"].filter((name) => present.has(name));

    await db.transaction(async (tx) => {
      for (const { id } of abandoned) {
        for (const table of linked) await tx.prepare(`DELETE FROM ${table} WHERE shipment_id = ?`).run(id);
        await tx.prepare(`DELETE FROM commercial_invoice_lines WHERE invoice_id IN (SELECT id FROM commercial_invoices WHERE shipment_id = ?)`).run(id);
        await tx.prepare(`DELETE FROM commercial_invoices WHERE shipment_id = ?`).run(id);
        await tx.prepare(`DELETE FROM quote_options WHERE quote_id IN (SELECT id FROM quotes WHERE shipment_id = ?)`).run(id);
        await tx.prepare(`DELETE FROM quotes WHERE shipment_id = ?`).run(id);
        await tx.prepare(`DELETE FROM payment_intents WHERE shipment_id = ?`).run(id);
        await tx.prepare(`DELETE FROM tracking_events WHERE shipment_id = ?`).run(id);
        await tx.prepare(`DELETE FROM shipments WHERE id = ? AND status IN (${marks})`).run(id, ...UNBOOKED);
      }
    });
    console.info("[shipment-purge.ts:purgeAbandonedDrafts] removed", abandoned.length, "abandoned drafts");
    return abandoned.length;
  } catch (error) {
    console.error("[shipment-purge.ts:purgeAbandonedDrafts]", error instanceof Error ? error.message : error);
    return 0;
  }
}
