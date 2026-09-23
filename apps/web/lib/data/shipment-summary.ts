import { getDb } from "@/lib/db";
import { getInvoiceForShipment } from "@/lib/data/invoices";
import { getSettleSummary, type SettleSummary } from "@/lib/data/settle";
import type { CommercialInvoice } from "@/lib/domain/invoice";

export type ShipmentSummary = {
  id: string;
  status: string;
  lane: string;
  currency: string;
  packageType: string;
  serviceClass: string;
  weightKg: number;
  contents: string;
  originCity: string;
  originCountry: string;
  originContactName: string | null;
  destinationCity: string;
  destinationCountry: string;
  destinationContactName: string | null;
  hulakicoAwb: string | null;
  externalAwb: string | null;
  carrierName: string | null;
  trackingToken: string | null;
  updatedAt: string;
  createdAt: string;
  invoice: CommercialInvoice | null;
  settle: SettleSummary;
};

/** Short shipment details for the signed-in owner (account hub). */
export function getMyShipmentSummary(
  userId: string,
  shipmentId: string,
): ShipmentSummary | { error: string } {
  try {
    const row = getDb()
      .prepare(
        `SELECT s.id, s.status, s.lane, s.currency, s.package_type, s.service_class, s.weight_kg,
                s.contents, s.origin_city, s.origin_country, s.origin_contact_name,
                s.destination_city, s.destination_country, s.destination_contact_name,
                s.hulakico_awb, s.external_awb, s.tracking_token, s.updated_at, s.created_at,
                c.name as carrier_name
         FROM shipments s
         LEFT JOIN carriers c ON c.id = s.carrier_id
         WHERE s.id = ? AND s.user_id = ?`,
      )
      .get(shipmentId, userId) as
      | {
          id: string;
          status: string;
          lane: string;
          currency: string;
          package_type: string;
          service_class: string;
          weight_kg: number;
          contents: string;
          origin_city: string;
          origin_country: string;
          origin_contact_name: string | null;
          destination_city: string;
          destination_country: string;
          destination_contact_name: string | null;
          hulakico_awb: string | null;
          external_awb: string | null;
          tracking_token: string | null;
          updated_at: string;
          created_at: string;
          carrier_name: string | null;
        }
      | undefined;
    if (!row) return { error: "Shipment not found." };
    return {
      id: row.id,
      status: row.status,
      lane: row.lane,
      currency: row.currency,
      packageType: row.package_type,
      serviceClass: row.service_class,
      weightKg: row.weight_kg,
      contents: row.contents,
      originCity: row.origin_city,
      originCountry: row.origin_country,
      originContactName: row.origin_contact_name,
      destinationCity: row.destination_city,
      destinationCountry: row.destination_country,
      destinationContactName: row.destination_contact_name,
      hulakicoAwb: row.hulakico_awb,
      externalAwb: row.external_awb,
      carrierName: row.carrier_name,
      trackingToken: row.tracking_token,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      invoice:
        row.lane === "INTERNATIONAL" ? getInvoiceForShipment(row.id) : null,
      settle: getSettleSummary(row.id),
    };
  } catch (error) {
    console.error(
      "[shipment-summary.ts:getMyShipmentSummary]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not load shipment." };
  }
}
