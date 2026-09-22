import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";

const BOOKED_STATUSES = [
  "BOOKED",
  "HANDOVER_PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "EXCEPTION",
] as const;

/** Ops: attach or replace the partner (DHL/FedEx) waybill on a booked shipment. */
export function updatePartnerAwb(
  shipmentId: string,
  externalAwb: string,
): { ok: true; externalAwb: string } | { error: string } {
  try {
    const awb = externalAwb.trim().toUpperCase();
    if (awb.length < 6 || awb.length > 40) {
      return { error: "Partner AWB must be 6–40 characters." };
    }
    const db = getDb();
    const row = db
      .prepare(`SELECT id, status, external_awb, origin_country FROM shipments WHERE id = ?`)
      .get(shipmentId) as
      | { id: string; status: string; external_awb: string | null; origin_country: string }
      | undefined;
    if (!row) return { error: "Shipment not found." };
    if (!(BOOKED_STATUSES as readonly string[]).includes(row.status)) {
      return { error: "Partner AWB can only be set on booked shipments." };
    }

    const now = new Date().toISOString();
    const previous = row.external_awb?.trim() || null;
    db.prepare(
      `UPDATE shipments SET external_awb = ?, updated_at = ? WHERE id = ?`,
    ).run(awb, now, shipmentId);

    const description = previous
      ? `Partner AWB updated from ${previous} to ${awb}.`
      : `Partner AWB attached: ${awb}.`;
    db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(newId("evt"), shipmentId, row.status, description, row.origin_country, now);

    return { ok: true, externalAwb: awb };
  } catch (error) {
    console.error(
      "[partner-awb.ts:updatePartnerAwb]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not save partner AWB." };
  }
}
