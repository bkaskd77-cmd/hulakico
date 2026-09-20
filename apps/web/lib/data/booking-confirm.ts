import { randomBytes } from "node:crypto";
import { getCarrierAdapter } from "@/lib/carriers/adapter";
import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";

export type BookedShipment = {
  id: string;
  status: string;
  hulakicoAwb: string;
  externalAwb: string;
  trackingToken: string;
  carrierName: string;
};

export async function confirmShipmentBooking(
  userId: string,
  shipmentId: string,
  quoteOptionId: string,
): Promise<BookedShipment> {
  try {
    const db = getDb();
    const shipment = db
      .prepare(
        `SELECT id, status, origin_country, destination_country, weight_kg, service_class
         FROM shipments WHERE id = ? AND user_id = ?`,
      )
      .get(shipmentId, userId) as
      | {
          id: string;
          status: string;
          origin_country: string;
          destination_country: string;
          weight_kg: number;
          service_class: string;
        }
      | undefined;

    if (!shipment) {
      throw new Error("Shipment not found.");
    }
    if (shipment.status !== "QUOTED" && shipment.status !== "DRAFT") {
      throw new Error("Shipment is already booked.");
    }

    const option = db
      .prepare(
        `SELECT qo.id, qo.carrier_id, qo.carrier_service_id, qo.carrier_name, qo.service_name,
                cs.code as service_code, c.adapter_key
         FROM quote_options qo
         JOIN quotes q ON q.id = qo.quote_id
         JOIN carriers c ON c.id = qo.carrier_id
         JOIN carrier_services cs ON cs.id = qo.carrier_service_id
         WHERE qo.id = ? AND q.shipment_id = ?`,
      )
      .get(quoteOptionId, shipmentId) as
      | {
          id: string;
          carrier_id: string;
          carrier_service_id: string;
          carrier_name: string;
          service_name: string;
          service_code: string;
          adapter_key: string;
        }
      | undefined;

    if (!option) {
      throw new Error("Quote option not found for this shipment.");
    }

    const adapter = getCarrierAdapter(option.adapter_key);
    const booked = await adapter.createShipment({
      originCountry: shipment.origin_country,
      destinationCountry: shipment.destination_country,
      weightKg: shipment.weight_kg,
      serviceCode: option.service_code,
    });

    const now = new Date().toISOString();
    const hulakicoAwb = `HK-${randomBytes(4).toString("hex").toUpperCase()}`;
    const trackingToken = randomBytes(16).toString("base64url");

    db.prepare(
      `UPDATE shipments SET
         status = 'BOOKED',
         hulakico_awb = ?,
         external_awb = ?,
         selected_quote_option_id = ?,
         carrier_id = ?,
         carrier_service_id = ?,
         tracking_token = ?,
         updated_at = ?
       WHERE id = ?`,
    ).run(
      hulakicoAwb,
      booked.externalAwb,
      option.id,
      option.carrier_id,
      option.carrier_service_id,
      trackingToken,
      now,
      shipmentId,
    );

    db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      newId("evt"),
      shipmentId,
      "BOOKED",
      `Booked with ${option.carrier_name}. Hulakico AWB ${hulakicoAwb}. ${booked.message}`,
      shipment.origin_country,
      now,
    );

    db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      newId("evt"),
      shipmentId,
      "HANDOVER_PENDING",
      "Awaiting handover to carrier partner.",
      shipment.origin_country,
      now,
    );

    db.prepare(
      `UPDATE shipments SET status = 'HANDOVER_PENDING', updated_at = ? WHERE id = ?`,
    ).run(now, shipmentId);

    return {
      id: shipmentId,
      status: "HANDOVER_PENDING",
      hulakicoAwb,
      externalAwb: booked.externalAwb,
      trackingToken,
      carrierName: option.carrier_name,
    };
  } catch (error) {
    console.error(
      "[booking-confirm.ts:confirmShipmentBooking]",
      error instanceof Error ? error.message : error,
    );
    throw error instanceof Error ? error : new Error("Booking failed.");
  }
}
