import { getDb } from "@/lib/db";
import { getInvoiceForShipment } from "@/lib/data/invoices";
import { getSettleSummary, type SettleSummary } from "@/lib/data/settle";
import type { CommercialInvoice } from "@/lib/domain/invoice";

export type ShipmentParty = {
  contactName: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  line1: string | null;
  line2: string | null;
  city: string;
  postalCode: string | null;
  country: string;
};

export type ShipmentSummary = {
  id: string;
  status: string;
  lane: string;
  currency: string;
  packageType: string;
  serviceClass: string;
  weightKg: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  volumetricKg: number | null;
  chargeableKg: number;
  declaredValue: number | null;
  contents: string;
  origin: ShipmentParty;
  destination: ShipmentParty;
  hulakicoAwb: string | null;
  externalAwb: string | null;
  carrierName: string | null;
  trackingToken: string | null;
  updatedAt: string;
  createdAt: string;
  invoice: CommercialInvoice | null;
  settle: SettleSummary;
};

function volumetricKg(
  lengthCm: number | null,
  widthCm: number | null,
  heightCm: number | null,
  lane: string,
): number | null {
  if (!lengthCm || !widthCm || !heightCm) return null;
  const divisor = lane === "INTERNATIONAL" ? 5000 : 6000;
  return Math.round(((lengthCm * widthCm * heightCm) / divisor) * 100) / 100;
}

/** Short shipment details for the signed-in owner (account hub). */
export function getMyShipmentSummary(
  userId: string,
  shipmentId: string,
): ShipmentSummary | { error: string } {
  try {
    const row = getDb()
      .prepare(
        `SELECT s.id, s.status, s.lane, s.currency, s.package_type, s.service_class,
                s.weight_kg, s.length_cm, s.width_cm, s.height_cm, s.declared_value, s.contents,
                s.origin_city, s.origin_country, s.origin_contact_name, s.origin_company,
                s.origin_phone, s.origin_email, s.origin_line1, s.origin_line2, s.origin_postal_code,
                s.destination_city, s.destination_country, s.destination_contact_name,
                s.destination_company, s.destination_phone, s.destination_email,
                s.destination_line1, s.destination_line2, s.destination_postal_code,
                s.hulakico_awb, s.external_awb, s.tracking_token, s.updated_at, s.created_at,
                c.name as carrier_name
         FROM shipments s LEFT JOIN carriers c ON c.id = s.carrier_id
         WHERE s.id = ? AND s.user_id = ?`,
      )
      .get(shipmentId, userId) as Record<string, unknown> | undefined;
    if (!row) return { error: "Shipment not found." };

    const lane = String(row.lane);
    const weightKg = Number(row.weight_kg);
    const lengthCm = row.length_cm == null ? null : Number(row.length_cm);
    const widthCm = row.width_cm == null ? null : Number(row.width_cm);
    const heightCm = row.height_cm == null ? null : Number(row.height_cm);
    const vol = volumetricKg(lengthCm, widthCm, heightCm, lane);

    return {
      id: String(row.id),
      status: String(row.status),
      lane,
      currency: String(row.currency),
      packageType: String(row.package_type),
      serviceClass: String(row.service_class),
      weightKg,
      lengthCm,
      widthCm,
      heightCm,
      volumetricKg: vol,
      chargeableKg: vol == null ? weightKg : Math.max(weightKg, vol),
      declaredValue: row.declared_value == null ? null : Number(row.declared_value),
      contents: String(row.contents),
      origin: {
        contactName: (row.origin_contact_name as string | null) ?? null,
        company: (row.origin_company as string | null) ?? null,
        phone: (row.origin_phone as string | null) ?? null,
        email: (row.origin_email as string | null) ?? null,
        line1: (row.origin_line1 as string | null) ?? null,
        line2: (row.origin_line2 as string | null) ?? null,
        city: String(row.origin_city),
        postalCode: (row.origin_postal_code as string | null) ?? null,
        country: String(row.origin_country),
      },
      destination: {
        contactName: (row.destination_contact_name as string | null) ?? null,
        company: (row.destination_company as string | null) ?? null,
        phone: (row.destination_phone as string | null) ?? null,
        email: (row.destination_email as string | null) ?? null,
        line1: (row.destination_line1 as string | null) ?? null,
        line2: (row.destination_line2 as string | null) ?? null,
        city: String(row.destination_city),
        postalCode: (row.destination_postal_code as string | null) ?? null,
        country: String(row.destination_country),
      },
      hulakicoAwb: (row.hulakico_awb as string | null) ?? null,
      externalAwb: (row.external_awb as string | null) ?? null,
      carrierName: (row.carrier_name as string | null) ?? null,
      trackingToken: (row.tracking_token as string | null) ?? null,
      updatedAt: String(row.updated_at),
      createdAt: String(row.created_at),
      invoice: lane === "INTERNATIONAL" ? getInvoiceForShipment(String(row.id)) : null,
      settle: getSettleSummary(String(row.id)),
    };
  } catch (error) {
    console.error(
      "[shipment-summary.ts:getMyShipmentSummary]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not load shipment." };
  }
}
