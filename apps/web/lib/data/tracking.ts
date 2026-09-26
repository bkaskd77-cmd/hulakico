import { getSql } from "@/lib/sql";
import {
  cleanTimeline,
  noteFor,
  syncEvents,
} from "@/lib/data/tracking-timeline";
import type { PublicTrackingView } from "@/lib/data/tracking-types";

export type { PublicTrackingView, TrackEvent } from "@/lib/data/tracking-types";

const CONTACT_HINT =
  "Please contact Hulakico for more information so we can clear this hold.";

export async function getTrackingByToken(
  token: string,
): Promise<PublicTrackingView | null> {
  try {
    const db = await getSql();
    const shipment = (await db
      .prepare(
        `SELECT s.id, s.hulakico_awb, s.external_awb, s.status, s.origin_city,
               s.destination_city, s.lane, s.updated_at, s.partner_label,
               s.partner_track_url, c.name as carrier_name
         FROM shipments s LEFT JOIN carriers c ON c.id = s.carrier_id
         WHERE s.tracking_token = ?`,
      )
      .get(token)) as
      | {
          id: string;
          hulakico_awb: string | null;
          external_awb: string | null;
          status: string;
          origin_city: string;
          destination_city: string;
          lane: string;
          updated_at: string;
          partner_label: string | null;
          partner_track_url: string | null;
          carrier_name: string | null;
        }
      | undefined;
    if (!shipment?.hulakico_awb) return null;

    const infoRow = (await db
      .prepare(
        `SELECT info_request_note, customer_reply FROM exception_cases
         WHERE shipment_id = ? AND status = 'INFO_REQUIRED'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(shipment.id)) as
      | { info_request_note: string | null; customer_reply: string | null }
      | undefined;

    const openHold = (await db
      .prepare(
        `SELECT reason FROM exception_cases
         WHERE shipment_id = ? AND status IN ('OPEN', 'INFO_REQUIRED')
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(shipment.id)) as { reason: string } | undefined;

    const rows = (await db
      .prepare(
        `SELECT id, status, description, location, occurred_at
         FROM tracking_events WHERE shipment_id = ? ORDER BY occurred_at ASC`,
      )
      .all(shipment.id)) as Array<{
      id: string;
      status: string;
      description: string;
      location: string | null;
      occurred_at: string;
    }>;

    const cleaned = cleanTimeline(
      rows.map((e) => ({
        id: e.id,
        status: e.status,
        description: e.description,
        location: e.location,
        occurredAt: e.occurred_at,
      })),
    );

    const holdReason = openHold?.reason?.trim() || null;

    return {
      hulakicoAwb: shipment.hulakico_awb,
      externalAwb: shipment.external_awb,
      status: shipment.status,
      statusNote: holdReason
        ? `Shipment is on hold: ${holdReason}`
        : noteFor(shipment.status),
      originCity: shipment.origin_city,
      destinationCity: shipment.destination_city,
      lane: shipment.lane,
      carrierName: shipment.carrier_name,
      partnerLabel: shipment.partner_label,
      partnerTrackUrl: shipment.partner_track_url,
      trackingToken: token,
      holdInfo: holdReason
        ? { reason: holdReason, contactHint: CONTACT_HINT }
        : null,
      infoRequest: infoRow?.info_request_note
        ? {
            note: infoRow.info_request_note,
            customerReply: infoRow.customer_reply,
          }
        : null,
      events: syncEvents(
        cleaned,
        shipment.status,
        shipment.updated_at,
        shipment.status === "OUT_FOR_DELIVERY" ||
          shipment.status === "DELIVERED"
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

export async function getBookedShipmentForUser(userId: string, shipmentId: string) {
  try {
    return (
      ((await (await getSql())
        .prepare(
          `SELECT id, status, hulakico_awb, external_awb, tracking_token, origin_city, destination_city
           FROM shipments WHERE id = ? AND user_id = ?`,
        )
        .get(shipmentId, userId)) as {
        id: string;
        status: string;
        hulakico_awb: string | null;
        external_awb: string | null;
        tracking_token: string | null;
        origin_city: string;
        destination_city: string;
      } | undefined) ?? null
    );
  } catch (error) {
    console.error(
      "[tracking.ts:getBookedShipmentForUser]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
