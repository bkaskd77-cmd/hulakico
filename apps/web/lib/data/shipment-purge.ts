import { getDb } from "@/lib/db";

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
export function purgeExpiredFinishedShipments(): number {
  try {
    const db = getDb();
    const cutoff = retentionCutoffIso();
    const placeholders = FINISHED.map(() => "?").join(", ");
    const expired = db
      .prepare(
        `SELECT id FROM shipments WHERE status IN (${placeholders}) AND updated_at < ?`,
      )
      .all(...FINISHED, cutoff) as Array<{ id: string }>;
    if (expired.length === 0) return 0;

    db.exec("BEGIN");
    try {
      for (const { id } of expired) {
        const invoices = db
          .prepare(`SELECT id FROM commercial_invoices WHERE shipment_id = ?`)
          .all(id) as Array<{ id: string }>;
        for (const inv of invoices) {
          db.prepare(`DELETE FROM commercial_invoice_lines WHERE invoice_id = ?`).run(inv.id);
        }
        db.prepare(`DELETE FROM commercial_invoices WHERE shipment_id = ?`).run(id);
        const quotes = db
          .prepare(`SELECT id FROM quotes WHERE shipment_id = ?`)
          .all(id) as Array<{ id: string }>;
        for (const quote of quotes) {
          db.prepare(`DELETE FROM quote_options WHERE quote_id = ?`).run(quote.id);
        }
        db.prepare(`DELETE FROM quotes WHERE shipment_id = ?`).run(id);
        db.prepare(`DELETE FROM tracking_events WHERE shipment_id = ?`).run(id);
        db.prepare(`DELETE FROM exception_cases WHERE shipment_id = ?`).run(id);
        db.prepare(`DELETE FROM cod_collections WHERE shipment_id = ?`).run(id);
        db.prepare(`DELETE FROM shipments WHERE id = ?`).run(id);
      }
      db.exec("COMMIT");
    } catch (inner) {
      db.exec("ROLLBACK");
      throw inner;
    }
    return expired.length;
  } catch (error) {
    console.error(
      "[shipment-purge.ts:purgeExpiredFinishedShipments]",
      error instanceof Error ? error.message : error,
    );
    return 0;
  }
}
