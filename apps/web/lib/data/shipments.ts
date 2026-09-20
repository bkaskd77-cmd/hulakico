import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";
import {
  detectLane,
  normalizeCountry,
  type DraftBookingInput,
} from "@/lib/domain/booking";

export type DraftShipment = {
  id: string;
  status: "DRAFT";
  lane: "DOMESTIC" | "INTERNATIONAL";
  transportMode: "THIRD_PARTY";
};

export function createDraftShipment(
  userId: string,
  organizationId: string | null,
  input: DraftBookingInput,
): DraftShipment {
  try {
    const db = getDb();
    const id = newId("shp");
    const now = new Date().toISOString();
    const originCountry = normalizeCountry(input.originCountry);
    const destinationCountry = normalizeCountry(input.destinationCountry);
    const lane = detectLane(originCountry, destinationCountry);

    db.prepare(
      `INSERT INTO shipments (
         id, user_id, organization_id, status, transport_mode, lane, package_type,
         service_class, origin_country, origin_city, origin_address,
         destination_country, destination_city, destination_address,
         weight_kg, length_cm, width_cm, height_cm, declared_value, currency,
         contents, wants_cod, created_at, updated_at
       ) VALUES (
         ?, ?, ?, 'DRAFT', 'THIRD_PARTY', ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?,
         ?, ?, ?, ?, ?, ?,
         ?, ?, ?, ?
       )`,
    ).run(
      id,
      userId,
      organizationId,
      lane,
      input.packageType,
      input.serviceClass,
      originCountry,
      input.originCity.trim(),
      input.originAddress.trim(),
      destinationCountry,
      input.destinationCity.trim(),
      input.destinationAddress.trim(),
      input.weightKg,
      input.lengthCm ?? null,
      input.widthCm ?? null,
      input.heightCm ?? null,
      input.declaredValue ?? null,
      input.currency,
      input.contents.trim(),
      input.wantsCod ? 1 : 0,
      now,
      now,
    );

    return { id, status: "DRAFT", lane, transportMode: "THIRD_PARTY" };
  } catch (error) {
    console.error(
      "[shipments.ts:createDraftShipment]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not save draft shipment.");
  }
}

export function getDraftShipmentForUser(userId: string, shipmentId: string) {
  try {
    const db = getDb();
    return (
      (db
        .prepare(
          `SELECT id, status, lane, transport_mode, origin_city, destination_city,
                  package_type, wants_cod
           FROM shipments WHERE id = ? AND user_id = ?`,
        )
        .get(shipmentId, userId) as
        | {
            id: string;
            status: string;
            lane: string;
            transport_mode: string;
            origin_city: string;
            destination_city: string;
            package_type: string;
            wants_cod: number;
          }
        | undefined) ?? null
    );
  } catch (error) {
    console.error(
      "[shipments.ts:getDraftShipmentForUser]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
