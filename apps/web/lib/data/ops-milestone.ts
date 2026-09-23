import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";
import { logCustomerNotification } from "@/lib/data/notifications";

const MILESTONES = [
  "HANDOVER_PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export type OpsMilestone = (typeof MILESTONES)[number];

const LABELS: Record<OpsMilestone, string> = {
  HANDOVER_PENDING: "Shipment is handed over / picked up now.",
  IN_TRANSIT: "Shipment is in transit now.",
  OUT_FOR_DELIVERY: "Shipment is out for delivery now.",
  DELIVERED: "Shipment is delivered now.",
};

const RANK: Record<string, number> = {
  BOOKED: 0,
  HANDOVER_PENDING: 1,
  IN_TRANSIT: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  EXCEPTION: 0,
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

export function milestoneRank(status: string): number {
  return RANK[status] ?? 0;
}

/** Ops: set Hulakico status forward (may skip steps); never move backward. */
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
        `SELECT id, status, origin_city, destination_city, hulakico_awb
         FROM shipments WHERE id = ?`,
      )
      .get(shipmentId) as
      | {
          id: string;
          status: string;
          origin_city: string;
          destination_city: string;
          hulakico_awb: string | null;
        }
      | undefined;
    if (!row) return { error: "Shipment not found." };
    if (!ALLOWED_FROM.has(row.status)) {
      return { error: "Milestones only apply to active booked shipments." };
    }

    const current = milestoneRank(row.status);
    const next = milestoneRank(milestone);
    if (next <= current) {
      return {
        error: `Already at ${row.status.replaceAll("_", " ")}. Pick a later milestone.`,
      };
    }

    const location =
      milestone === "OUT_FOR_DELIVERY" || milestone === "DELIVERED"
        ? row.destination_city
        : row.origin_city;

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
      location,
      now,
    );

    if (milestone === "HANDOVER_PENDING" || milestone === "DELIVERED") {
      const awb = row.hulakico_awb ?? shipmentId;
      const notify = logCustomerNotification({
        shipmentId,
        kind: milestone === "DELIVERED" ? "DELIVERED" : "HANDED_OVER",
        subject:
          milestone === "DELIVERED"
            ? `Hulakico delivered · ${awb}`
            : `Hulakico handed over · ${awb}`,
        body: LABELS[milestone],
      });
      if ("error" in notify) {
        console.error("[ops-milestone.ts:postOpsMilestone]", notify.error);
      }
    }

    return { ok: true, status: milestone };
  } catch (error) {
    console.error(
      "[ops-milestone.ts:postOpsMilestone]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not post Hulakico milestone." };
  }
}
