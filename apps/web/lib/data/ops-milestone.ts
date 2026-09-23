import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";

const MILESTONES = [
  "HANDOVER_PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export type OpsMilestone = (typeof MILESTONES)[number];

const LABELS: Record<OpsMilestone, string> = {
  HANDOVER_PENDING: "Handover pending / with partner",
  IN_TRANSIT: "In transit (Hulakico confirmed)",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};

const ALLOWED_FROM = new Set([
  "BOOKED",
  "HANDOVER_PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "EXCEPTION",
]);

export function listOpsMilestones(): Array<{ status: OpsMilestone; label: string }> {
  return MILESTONES.map((status) => ({ status, label: LABELS[status] }));
}

/** Ops: set Hulakico milestone + append a tracking_events row (no partner API). */
export function postOpsMilestone(
  shipmentId: string,
  status: string,
): { ok: true; status: OpsMilestone } | { error: string } {
  try {
    if (!(MILESTONES as readonly string[]).includes(status)) {
      return { error: "Unknown Hulakico milestone." };
    }
    const milestone = status as OpsMilestone;
    const db = getDb();
    const row = db
      .prepare(
        `SELECT id, status, origin_city FROM shipments WHERE id = ?`,
      )
      .get(shipmentId) as
      | { id: string; status: string; origin_city: string }
      | undefined;
    if (!row) return { error: "Shipment not found." };
    if (!ALLOWED_FROM.has(row.status) && row.status !== "DELIVERED") {
      return { error: "Milestones only apply to booked active shipments." };
    }
    if (row.status === "DELIVERED" && milestone !== "DELIVERED") {
      return { error: "Delivered shipments cannot move backward." };
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE shipments SET status = ?, updated_at = ? WHERE id = ?`,
    ).run(milestone, now, shipmentId);
    db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      newId("evt"),
      shipmentId,
      milestone,
      LABELS[milestone],
      row.origin_city,
      now,
    );
    return { ok: true, status: milestone };
  } catch (error) {
    console.error(
      "[ops-milestone.ts:postOpsMilestone]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not post Hulakico milestone." };
  }
}
