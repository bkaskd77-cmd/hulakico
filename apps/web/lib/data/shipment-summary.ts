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
  partnerLabel: string | null;
  partnerTrackUrl: string | null;
  trackingToken: string | null;
  updatedAt: string;
  createdAt: string;
  invoice: CommercialInvoice | null;
  settle: SettleSummary;
  customerEmail?: string;
  customerName?: string;
};

const SELECT = `SELECT s.id, s.status, s.lane, s.currency, s.package_type, s.service_class,
  s.weight_kg, s.length_cm, s.width_cm, s.height_cm, s.declared_value, s.contents,
  s.origin_city, s.origin_country, s.origin_contact_name, s.origin_company,
  s.origin_phone, s.origin_email, s.origin_line1, s.origin_line2, s.origin_postal_code,
  s.destination_city, s.destination_country, s.destination_contact_name,
  s.destination_company, s.destination_phone, s.destination_email,
  s.destination_line1, s.destination_line2, s.destination_postal_code,
  s.hulakico_awb, s.external_awb, s.partner_label, s.partner_track_url,
  s.tracking_token, s.updated_at, s.created_at, c.name as carrier_name,
  u.email as customer_email, u.name as customer_name
  FROM shipments s LEFT JOIN carriers c ON c.id = s.carrier_id
  JOIN users u ON u.id = s.user_id`;

function party(row: Record<string, unknown>, side: "origin" | "destination"): ShipmentParty {
  const p = side === "origin" ? "origin" : "destination";
  return {
    contactName: (row[`${p}_contact_name`] as string | null) ?? null,
    company: (row[`${p}_company`] as string | null) ?? null,
    phone: (row[`${p}_phone`] as string | null) ?? null,
    email: (row[`${p}_email`] as string | null) ?? null,
    line1: (row[`${p}_line1`] as string | null) ?? null,
    line2: (row[`${p}_line2`] as string | null) ?? null,
    city: String(row[`${p}_city`]),
    postalCode: (row[`${p}_postal_code`] as string | null) ?? null,
    country: String(row[`${p}_country`]),
  };
}

function mapRow(row: Record<string, unknown>): ShipmentSummary {
  const lane = String(row.lane);
  const weightKg = Number(row.weight_kg);
  const lengthCm = row.length_cm == null ? null : Number(row.length_cm);
  const widthCm = row.width_cm == null ? null : Number(row.width_cm);
  const heightCm = row.height_cm == null ? null : Number(row.height_cm);
  let vol: number | null = null;
  if (lengthCm && widthCm && heightCm) {
    const div = lane === "INTERNATIONAL" ? 5000 : 6000;
    vol = Math.round(((lengthCm * widthCm * heightCm) / div) * 100) / 100;
  }
  return {
    id: String(row.id), status: String(row.status), lane, currency: String(row.currency),
    packageType: String(row.package_type), serviceClass: String(row.service_class),
    weightKg, lengthCm, widthCm, heightCm, volumetricKg: vol,
    chargeableKg: vol == null ? weightKg : Math.max(weightKg, vol),
    declaredValue: row.declared_value == null ? null : Number(row.declared_value),
    contents: String(row.contents), origin: party(row, "origin"), destination: party(row, "destination"),
    hulakicoAwb: (row.hulakico_awb as string | null) ?? null,
    externalAwb: (row.external_awb as string | null) ?? null,
    carrierName: (row.carrier_name as string | null) ?? null,
    partnerLabel: (row.partner_label as string | null) ?? null,
    partnerTrackUrl: (row.partner_track_url as string | null) ?? null,
    trackingToken: (row.tracking_token as string | null) ?? null,
    updatedAt: String(row.updated_at), createdAt: String(row.created_at),
    invoice: lane === "INTERNATIONAL" ? getInvoiceForShipment(String(row.id)) : null,
    settle: getSettleSummary(String(row.id)),
    customerEmail: String(row.customer_email),
    customerName: String(row.customer_name),
  };
}

/** Short shipment details for the signed-in owner (account hub). */
export function getMyShipmentSummary(
  userId: string,
  shipmentId: string,
): ShipmentSummary | { error: string } {
  try {
    const row = getDb()
      .prepare(`${SELECT} WHERE s.id = ? AND s.user_id = ?`)
      .get(shipmentId, userId) as Record<string, unknown> | undefined;
    if (!row) return { error: "Shipment not found." };
    return mapRow(row);
  } catch (error) {
    console.error(
      "[shipment-summary.ts:getMyShipmentSummary]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not load shipment." };
  }
}

/** Staff view — any shipment by id (no customer ownership check). */
export function getStaffShipmentSummary(
  shipmentId: string,
): ShipmentSummary | { error: string } {
  try {
    const row = getDb()
      .prepare(`${SELECT} WHERE s.id = ?`)
      .get(shipmentId) as Record<string, unknown> | undefined;
    if (!row) return { error: "Shipment not found." };
    return mapRow(row);
  } catch (error) {
    console.error(
      "[shipment-summary.ts:getStaffShipmentSummary]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not load shipment." };
  }
}
