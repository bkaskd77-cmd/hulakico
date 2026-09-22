import { getDb } from "@/lib/db";
import { getInvoiceForShipment } from "@/lib/data/invoices";
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
  trackingToken: string | null;
  updatedAt: string;
  createdAt: string;
  invoice: CommercialInvoice | null;
};

/** Short shipment details for the signed-in owner (account hub). */
export function getMyShipmentSummary(
  userId: string,
  shipmentId: string,
): ShipmentSummary | { error: string } {
  try {
    const row = getDb()
      .prepare(
        `SELECT id, status, lane, currency, package_type, service_class, weight_kg,
                contents, origin_city, origin_country, origin_contact_name,
                destination_city, destination_country, destination_contact_name,
                hulakico_awb, tracking_token, updated_at, created_at
         FROM shipments WHERE id = ? AND user_id = ?`,
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
          tracking_token: string | null;
          updated_at: string;
          created_at: string;
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
      trackingToken: row.tracking_token,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      invoice:
        row.lane === "INTERNATIONAL" ? getInvoiceForShipment(row.id) : null,
    };
  } catch (error) {
    console.error(
      "[shipment-summary.ts:getMyShipmentSummary]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not load shipment." };
  }
}
