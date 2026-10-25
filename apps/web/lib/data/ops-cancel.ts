import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import { ensurePaymentsTable } from "@/lib/data/payments";

/** Shipments can be cancelled until the courier has them on the move. */
const CANCELLABLE = new Set(["DRAFT", "QUOTED", "BOOKED", "HANDOVER_PENDING", "EXCEPTION"]);

/**
 * Ops: cancel a shipment with a reason (shown on the customer's tracking page).
 * Unpaid payment records are cancelled too; a payment already marked PAID stays for refund.
 */
export async function cancelShipment(shipmentId: string, reason: string): Promise<{ ok: true } | { error: string }> {
  try {
    const why = reason.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
    if (why.length < 3) return { error: "Give a short reason for cancelling." };
    const db = await getSql();
    const row = (await db.prepare(`SELECT status FROM shipments WHERE id = ?`).get(shipmentId)) as { status: string } | undefined;
    if (!row) return { error: "Shipment not found." };
    if (!CANCELLABLE.has(row.status)) {
      return { error: `A shipment that is ${row.status.replaceAll("_", " ").toLowerCase()} cannot be cancelled here.` };
    }
    await ensurePaymentsTable();
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx.prepare(`UPDATE shipments SET status = 'CANCELLED', updated_at = ? WHERE id = ?`).run(now, shipmentId);
      await tx.prepare(
        `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at) VALUES (?, ?, 'CANCELLED', ?, '', ?)`,
      ).run(newId("evt"), shipmentId, `Cancelled: ${why}`, now);
      await tx.prepare(`UPDATE payment_intents SET status = 'CANCELLED' WHERE shipment_id = ? AND status = 'AWAITING_PAYMENT'`).run(shipmentId);
    });
    return { ok: true };
  } catch (error) {
    console.error("[ops-cancel.ts:cancelShipment]", error instanceof Error ? error.message : error);
    return { error: "Could not cancel the shipment." };
  }
}
