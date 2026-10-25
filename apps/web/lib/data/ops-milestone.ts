import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import { logCustomerNotification } from "@/lib/data/notifications";
import { isFreightSettled } from "@/lib/data/payment-transfer";

const MILESTONES = ["HANDOVER_PENDING", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export type OpsMilestone = (typeof MILESTONES)[number];

/** What the customer reads when Ops adds no note of their own. */
const DEFAULT_TEXT: Record<OpsMilestone, string> = {
  HANDOVER_PENDING: "Picked up by the courier",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};

const RANK: Record<string, number> = {
  BOOKED: 0, HANDOVER_PENDING: 1, IN_TRANSIT: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 4, EXCEPTION: 0,
};

const ALLOWED_FROM = new Set(["BOOKED", "HANDOVER_PENDING", "IN_TRANSIT", "OUT_FOR_DELIVERY", "EXCEPTION"]);
const PLACE_OK = /^[\p{L}\p{N}][\p{L}\p{N} .,'()/-]{1,79}$/u;

export function milestoneRank(status: string): number {
  return RANK[status] ?? 0;
}

function cleanText(value: string | undefined, max: number): string {
  return (value ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * Where the update happened when Ops leaves it blank: the shipper's city for pickup,
 * the last place we saw it for transit, the receiver's city for delivery steps.
 */
function defaultLocation(milestone: OpsMilestone, row: { origin_city: string; destination_city: string }, last: string | null): string {
  if (milestone === "HANDOVER_PENDING") return row.origin_city;
  if (milestone === "IN_TRANSIT") return last || row.origin_city;
  return row.destination_city;
}

/**
 * Ops: post a tracking update. Steps move forward only, but "In transit" may be posted
 * again and again as the parcel moves through hubs. Each update carries a place and an
 * optional note (e.g. "Arrived at hub", "Customs cleared").
 */
export async function postOpsMilestone(
  shipmentId: string,
  status: string,
  input: { location?: string; note?: string } = {},
): Promise<{ ok: true; status: OpsMilestone } | { error: string }> {
  try {
    if (!(MILESTONES as readonly string[]).includes(status)) return { error: "Unknown Hulakico milestone." };
    const milestone = status as OpsMilestone;
    const typedPlace = cleanText(input.location, 80);
    if (typedPlace && !PLACE_OK.test(typedPlace)) return { error: "Enter a place name, such as Delhi or Kathmandu airport." };
    const note = cleanText(input.note, 120);

    const db = await getSql();
    const row = (await db
      .prepare(`SELECT id, status, origin_city, destination_city, hulakico_awb FROM shipments WHERE id = ?`)
      .get(shipmentId)) as
      | { id: string; status: string; origin_city: string; destination_city: string; hulakico_awb: string | null }
      | undefined;
    if (!row) return { error: "Shipment not found." };
    if (!ALLOWED_FROM.has(row.status)) return { error: "Milestones only apply to active booked shipments." };

    const current = milestoneRank(row.status);
    const next = milestoneRank(milestone);
    const transitAgain = milestone === "IN_TRANSIT" && row.status === "IN_TRANSIT";
    if (next <= current && !transitAgain) {
      return { error: `Already at ${row.status.replaceAll("_", " ").toLowerCase()}. Pick a later step.` };
    }

    // Nothing leaves the desk unpaid: a reported bank transfer must be confirmed first.
    if (milestone === "HANDOVER_PENDING" && !(await isFreightSettled(shipmentId))) {
      return { error: "Payment is not confirmed yet. Mark it paid in Admin → Payments before pickup." };
    }

    const lastEvent = (await db
      .prepare(`SELECT location FROM tracking_events WHERE shipment_id = ? AND length(trim(location)) > 2 ORDER BY occurred_at DESC LIMIT 1`)
      .get(shipmentId)) as { location: string } | undefined;
    const location = typedPlace || defaultLocation(milestone, row, lastEvent?.location ?? null);
    const description = note || DEFAULT_TEXT[milestone];

    const now = new Date().toISOString();
    await db.prepare(`UPDATE shipments SET status = ?, updated_at = ? WHERE id = ?`).run(milestone, now, shipmentId);
    await db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(newId("evt"), shipmentId, milestone, description, location, now);

    // Email the customer once per step: pickup and delivery, never for each transit scan.
    if (!transitAgain && (milestone === "HANDOVER_PENDING" || milestone === "DELIVERED")) {
      const awb = row.hulakico_awb ?? shipmentId;
      const delivered = milestone === "DELIVERED";
      const notify = await logCustomerNotification({
        shipmentId,
        kind: delivered ? "DELIVERED" : "HANDED_OVER",
        subject: delivered ? `Hulakico delivered · ${awb}` : `Hulakico handed over · ${awb}`,
        body: `${description} · ${location}`,
      });
      if ("error" in notify) console.error("[ops-milestone.ts:postOpsMilestone]", notify.error);
    }

    return { ok: true, status: milestone };
  } catch (error) {
    console.error("[ops-milestone.ts:postOpsMilestone]", error instanceof Error ? error.message : error);
    return { error: "Could not post Hulakico milestone." };
  }
}

export type MilestoneContext = {
  status: string;
  lane: string;
  originCity: string;
  destinationCity: string;
  destinationCountry: string;
  lastLocation: string | null;
};

/** What the Ops tracking form needs to suggest sensible places for the next update. */
export async function getMilestoneContext(shipmentId: string): Promise<MilestoneContext | { error: string }> {
  try {
    const db = await getSql();
    const row = (await db
      .prepare(`SELECT status, lane, origin_city, destination_city, destination_country FROM shipments WHERE id = ?`)
      .get(shipmentId)) as { status: string; lane: string; origin_city: string; destination_city: string; destination_country: string } | undefined;
    if (!row) return { error: "Shipment not found." };
    const last = (await db
      .prepare(`SELECT location FROM tracking_events WHERE shipment_id = ? AND length(trim(location)) > 2 ORDER BY occurred_at DESC LIMIT 1`)
      .get(shipmentId)) as { location: string } | undefined;
    return {
      status: row.status,
      lane: row.lane,
      originCity: row.origin_city,
      destinationCity: row.destination_city,
      destinationCountry: row.destination_country,
      lastLocation: last?.location ?? null,
    };
  } catch (error) {
    console.error("[ops-milestone.ts:getMilestoneContext]", error instanceof Error ? error.message : error);
    return { error: "Could not load the shipment route." };
  }
}
