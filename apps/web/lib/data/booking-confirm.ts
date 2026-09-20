import { randomBytes } from "node:crypto";
import { getCarrierAdapter } from "@/lib/carriers/adapter";
import { createCodCollection } from "@/lib/data/cod";
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
        `SELECT id, status, lane, origin_country, destination_country, weight_kg,
                wants_cod, declared_value, currency
         FROM shipments WHERE id = ? AND user_id = ?`,
      )
      .get(shipmentId, userId) as
      | {
          id: string; status: string; lane: string; origin_country: string;
          destination_country: string; weight_kg: number; wants_cod: number;
          declared_value: number | null; currency: string;
        }
      | undefined;

    if (!shipment) throw new Error("Shipment not found.");
    if (shipment.status !== "QUOTED" && shipment.status !== "DRAFT") {
      throw new Error("Shipment is already booked.");
    }

    const option = db
      .prepare(
        `SELECT qo.id, qo.carrier_id, qo.carrier_service_id, qo.carrier_name,
                qo.amount, cs.code as service_code, c.adapter_key
         FROM quote_options qo
         JOIN quotes q ON q.id = qo.quote_id
         JOIN carriers c ON c.id = qo.carrier_id
         JOIN carrier_services cs ON cs.id = qo.carrier_service_id
         WHERE qo.id = ? AND q.shipment_id = ?`,
      )
      .get(quoteOptionId, shipmentId) as
      | {
          id: string; carrier_id: string; carrier_service_id: string;
          carrier_name: string; amount: number; service_code: string;
          adapter_key: string;
        }
      | undefined;

    if (!option) throw new Error("Quote option not found for this shipment.");

    const booked = await getCarrierAdapter(option.adapter_key).createShipment({
      originCountry: shipment.origin_country,
      destinationCountry: shipment.destination_country,
      weightKg: shipment.weight_kg,
      serviceCode: option.service_code,
    });

    const now = new Date().toISOString();
    const hulakicoAwb = `HK-${randomBytes(4).toString("hex").toUpperCase()}`;
    const trackingToken = randomBytes(16).toString("base64url");

    db.prepare(
      `UPDATE shipments SET status = 'HANDOVER_PENDING', hulakico_awb = ?, external_awb = ?,
         selected_quote_option_id = ?, carrier_id = ?, carrier_service_id = ?,
         tracking_token = ?, updated_at = ? WHERE id = ?`,
    ).run(
      hulakicoAwb, booked.externalAwb, option.id, option.carrier_id,
      option.carrier_service_id, trackingToken, now, shipmentId,
    );

    const insertEvt = db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    insertEvt.run(
      newId("evt"), shipmentId, "BOOKED",
      `Booked with ${option.carrier_name}. Hulakico AWB ${hulakicoAwb}. ${booked.message}`,
      shipment.origin_country, now,
    );
    insertEvt.run(
      newId("evt"), shipmentId, "HANDOVER_PENDING",
      "Awaiting handover to carrier partner.", shipment.origin_country, now,
    );

    if (shipment.wants_cod === 1 && shipment.lane === "DOMESTIC") {
      const amount =
        shipment.declared_value && shipment.declared_value > 0
          ? shipment.declared_value
          : option.amount;
      const cod = createCodCollection({
        shipmentId, amount, currency: shipment.currency,
      });
      if ("error" in cod) {
        console.error("[booking-confirm.ts:confirmShipmentBooking]", cod.error);
      }
    }

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
