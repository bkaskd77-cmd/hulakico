import { getDb } from "@/lib/db";

export type PublicTrackingView = {
  hulakicoAwb: string;
  externalAwb: string | null;
  status: string;
  originCity: string;
  destinationCity: string;
  lane: string;
  carrierName: string | null;
  trackingToken: string;
  infoRequest: {
    note: string;
    customerReply: string | null;
  } | null;
  events: Array<{
    id: string;
    status: string;
    description: string;
    location: string | null;
    occurredAt: string;
  }>;
};

export function getTrackingByToken(token: string): PublicTrackingView | null {
  try {
    const db = getDb();
    const shipment = db
      .prepare(
        `SELECT s.id, s.hulakico_awb, s.external_awb, s.status, s.origin_city,
                s.destination_city, s.lane, c.name as carrier_name
         FROM shipments s
         LEFT JOIN carriers c ON c.id = s.carrier_id
         WHERE s.tracking_token = ?`,
      )
      .get(token) as
      | {
          id: string;
          hulakico_awb: string | null;
          external_awb: string | null;
          status: string;
          origin_city: string;
          destination_city: string;
          lane: string;
          carrier_name: string | null;
        }
      | undefined;

    if (!shipment || !shipment.hulakico_awb) {
      return null;
    }

    const infoRow = db
      .prepare(
        `SELECT info_request_note, customer_reply
         FROM exception_cases
         WHERE shipment_id = ? AND status = 'INFO_REQUIRED'
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .get(shipment.id) as
      | { info_request_note: string | null; customer_reply: string | null }
      | undefined;

    const events = db
      .prepare(
        `SELECT id, status, description, location, occurred_at
         FROM tracking_events WHERE shipment_id = ? ORDER BY occurred_at ASC`,
      )
      .all(shipment.id) as Array<{
      id: string;
      status: string;
      description: string;
      location: string | null;
      occurred_at: string;
    }>;

    return {
      hulakicoAwb: shipment.hulakico_awb,
      externalAwb: shipment.external_awb,
      status: shipment.status,
      originCity: shipment.origin_city,
      destinationCity: shipment.destination_city,
      lane: shipment.lane,
      carrierName: shipment.carrier_name,
      trackingToken: token,
      infoRequest:
        infoRow?.info_request_note
          ? {
              note: infoRow.info_request_note,
              customerReply: infoRow.customer_reply,
            }
          : null,
      events: events.map((event) => ({
        id: event.id,
        status: event.status,
        description: event.description,
        location: event.location,
        occurredAt: event.occurred_at,
      })),
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
    const db = getDb();
    return (
      (db
        .prepare(
          `SELECT id, status, hulakico_awb, external_awb, tracking_token, origin_city, destination_city
           FROM shipments WHERE id = ? AND user_id = ?`,
        )
        .get(shipmentId, userId) as
        | {
            id: string;
            status: string;
            hulakico_awb: string | null;
            external_awb: string | null;
            tracking_token: string | null;
            origin_city: string;
            destination_city: string;
          }
        | undefined) ?? null
    );
  } catch (error) {
    console.error(
      "[tracking.ts:getBookedShipmentForUser]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
