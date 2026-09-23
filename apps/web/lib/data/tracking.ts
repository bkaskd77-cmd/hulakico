import { getDb } from "@/lib/db";

const STATUS_NOTE: Record<string, string> = {
  BOOKED: "Shipment is booked now.",
  HANDOVER_PENDING: "Shipment is handed over / picked up now.",
  IN_TRANSIT: "Shipment is in transit now.",
  OUT_FOR_DELIVERY: "Shipment is out for delivery now.",
  DELIVERED: "Shipment is delivered now.",
  EXCEPTION: "Shipment is on hold now.",
  HOLD: "Shipment is on hold now.",
};

type TrackEvent = {
  id: string; status: string; description: string;
  location: string | null; occurredAt: string;
};

export type PublicTrackingView = {
  hulakicoAwb: string;
  externalAwb: string | null;
  status: string;
  statusNote: string;
  originCity: string;
  destinationCity: string;
  lane: string;
  carrierName: string | null;
  trackingToken: string;
  infoRequest: { note: string; customerReply: string | null } | null;
  events: TrackEvent[];
};

function noteFor(status: string): string {
  return STATUS_NOTE[status] ?? `Shipment is ${status.replaceAll("_", " ").toLowerCase()} now.`;
}

function isStubNoise(description: string): boolean {
  return /stub\s+(acceptance|transit|out for delivery)|sandbox (accepted|transit|out for)/i.test(description);
}

function statusKey(status: string): string {
  return status === "EXCEPTION" ? "HOLD" : status;
}

/** One clean row per status — drop stub demo scans and duplicates. */
function cleanTimeline(events: TrackEvent[]): TrackEvent[] {
  const real = events.filter((event) => !isStubNoise(event.description));
  const best = new Map<string, TrackEvent>();
  for (const event of real) {
    const key = statusKey(event.status);
    const prev = best.get(key);
    if (!prev || event.occurredAt < prev.occurredAt) best.set(key, event);
  }
  return [...best.values()].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

function syncEvents(
  events: TrackEvent[],
  status: string,
  updatedAt: string,
  location: string,
): TrackEvent[] {
  const key = statusKey(status);
  if (!STATUS_NOTE[status] && !STATUS_NOTE[key]) return events;
  if (events.some((e) => statusKey(e.status) === key)) return events;
  return [...events, {
    id: `sync-${key}`, status: key === "HOLD" ? "HOLD" : status,
    description: noteFor(status), location, occurredAt: updatedAt,
  }];
}

export function getTrackingByToken(token: string): PublicTrackingView | null {
  try {
    const db = getDb();
    const shipment = db.prepare(
      `SELECT s.id, s.hulakico_awb, s.external_awb, s.status, s.origin_city,
              s.destination_city, s.lane, s.updated_at, c.name as carrier_name
       FROM shipments s LEFT JOIN carriers c ON c.id = s.carrier_id
       WHERE s.tracking_token = ?`,
    ).get(token) as {
      id: string; hulakico_awb: string | null; external_awb: string | null; status: string;
      origin_city: string; destination_city: string; lane: string; updated_at: string;
      carrier_name: string | null;
    } | undefined;
    if (!shipment?.hulakico_awb) return null;

    const infoRow = db.prepare(
      `SELECT info_request_note, customer_reply FROM exception_cases
       WHERE shipment_id = ? AND status = 'INFO_REQUIRED'
       ORDER BY created_at DESC LIMIT 1`,
    ).get(shipment.id) as { info_request_note: string | null; customer_reply: string | null } | undefined;

    const rows = db.prepare(
      `SELECT id, status, description, location, occurred_at
       FROM tracking_events WHERE shipment_id = ? ORDER BY occurred_at ASC`,
    ).all(shipment.id) as Array<{
      id: string; status: string; description: string;
      location: string | null; occurred_at: string;
    }>;

    const cleaned = cleanTimeline(rows.map((e) => ({
      id: e.id, status: e.status, description: e.description,
      location: e.location, occurredAt: e.occurred_at,
    })));

    return {
      hulakicoAwb: shipment.hulakico_awb,
      externalAwb: shipment.external_awb,
      status: shipment.status,
      statusNote: noteFor(shipment.status),
      originCity: shipment.origin_city,
      destinationCity: shipment.destination_city,
      lane: shipment.lane,
      carrierName: shipment.carrier_name,
      trackingToken: token,
      infoRequest: infoRow?.info_request_note
        ? { note: infoRow.info_request_note, customerReply: infoRow.customer_reply }
        : null,
      events: syncEvents(
        cleaned,
        shipment.status,
        shipment.updated_at,
        shipment.status === "OUT_FOR_DELIVERY" || shipment.status === "DELIVERED"
          ? shipment.destination_city
          : shipment.origin_city,
      ),
    };
  } catch (error) {
    console.error(
      "[tracking.ts:getTrackingByToken]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export function getBookedShipmentForUser(userId: string, shipmentId: string) {
  try {
    return (getDb().prepare(
      `SELECT id, status, hulakico_awb, external_awb, tracking_token, origin_city, destination_city
       FROM shipments WHERE id = ? AND user_id = ?`,
    ).get(shipmentId, userId) as {
      id: string; status: string; hulakico_awb: string | null; external_awb: string | null;
      tracking_token: string | null; origin_city: string; destination_city: string;
    } | undefined) ?? null;
  } catch (error) {
    console.error("[tracking.ts:getBookedShipmentForUser]", error instanceof Error ? error.message : error);
    return null;
  }
}
