import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import {
  composeAddressLine,
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

export async function createDraftShipment(
  userId: string,
  organizationId: string | null,
  input: DraftBookingInput,
): Promise<DraftShipment> {
  try {
    const db = await getSql();
    const id = newId("shp");
    const now = new Date().toISOString();
    const originCountry = normalizeCountry(input.originCountry);
    const destinationCountry = normalizeCountry(input.destinationCountry);
    const lane = detectLane(originCountry, destinationCountry);
    const originAddress = composeAddressLine(
      input.originLine1,
      input.originLine2,
      input.originPostalCode,
    );
    const destinationAddress = composeAddressLine(
      input.destinationLine1,
      input.destinationLine2,
      input.destinationPostalCode,
    );

    await db.prepare(
      `INSERT INTO shipments (
         id, user_id, organization_id, status, transport_mode, lane, package_type,
         service_class, origin_country, origin_city, origin_address,
         destination_country, destination_city, destination_address,
         origin_contact_name, origin_company, origin_phone, origin_email,
         origin_line1, origin_line2, origin_postal_code,
         destination_contact_name, destination_company, destination_phone,
         destination_email, destination_line1, destination_line2,
         destination_postal_code,
         weight_kg, length_cm, width_cm, height_cm, declared_value, currency,
         contents, wants_cod, created_at, updated_at
       ) VALUES (
         ?, ?, ?, 'DRAFT', 'THIRD_PARTY', ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?,
         ?, ?, ?,
         ?, ?, ?,
         ?,
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
      originAddress,
      destinationCountry,
      input.destinationCity.trim(),
      destinationAddress,
      input.originContactName.trim(),
      input.originCompany?.trim() || null,
      input.originPhone.trim(),
      input.originEmail?.trim() || null,
      input.originLine1.trim(),
      input.originLine2?.trim() || null,
      input.originPostalCode?.trim() || null,
      input.destinationContactName.trim(),
      input.destinationCompany?.trim() || null,
      input.destinationPhone.trim(),
      input.destinationEmail?.trim() || null,
      input.destinationLine1.trim(),
      input.destinationLine2?.trim() || null,
      input.destinationPostalCode?.trim() || null,
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
    try {
      const db = await getSql();
      const fks = await db.prepare("PRAGMA foreign_key_list(shipments)").all();
      const userFound = await db.prepare("SELECT 1 AS ok FROM users WHERE id = ?").get(userId);
      const tableSql = await db.prepare("SELECT sql FROM sqlite_master WHERE name = 'shipments'").get();
      console.error("[shipments.ts:createDraftShipment:diag]", JSON.stringify({ userIdType: typeof userId, userFound: Boolean(userFound), fks, tableSql }));
    } catch (diagError) {
      console.error("[shipments.ts:createDraftShipment:diag] failed", diagError instanceof Error ? diagError.message : diagError);
    }
    throw new Error("Could not save draft shipment.");
  }
}

export { getDraftShipmentForUser } from "./shipment-query";

