import { getSql } from "@/lib/sql";
import { getInvoiceForShipment } from "@/lib/data/invoices";
import type { CommercialInvoice } from "@/lib/domain/invoice";

export type InvoiceDocumentShipment = {
  id: string;
  user_id: string;
  status: string;
  lane: string;
  currency: string;
  origin_country: string;
  origin_city: string;
  origin_contact_name: string | null;
  origin_company: string | null;
  origin_phone: string | null;
  origin_email: string | null;
  origin_line1: string | null;
  origin_line2: string | null;
  origin_postal_code: string | null;
  origin_address: string;
  destination_country: string;
  destination_city: string;
  destination_contact_name: string | null;
  destination_company: string | null;
  destination_phone: string | null;
  destination_email: string | null;
  destination_line1: string | null;
  destination_line2: string | null;
  destination_postal_code: string | null;
  destination_address: string;
  hulakico_awb: string | null;
};

/** Load digital invoice document for the owner or an OPS/ADMIN viewer. */
export async function getInvoiceDocument(
  viewerUserId: string,
  shipmentId: string,
  isAuthority: boolean,
): Promise<
  | { shipment: InvoiceDocumentShipment; invoice: CommercialInvoice | null }
  | { error: string }
> {
  try {
    const sql = `SELECT id, user_id, status, lane, currency,
      origin_country, origin_city, origin_contact_name, origin_company,
      origin_phone, origin_email, origin_line1, origin_line2, origin_postal_code,
      origin_address,
      destination_country, destination_city, destination_contact_name,
      destination_company, destination_phone, destination_email,
      destination_line1, destination_line2, destination_postal_code,
      destination_address, hulakico_awb
      FROM shipments WHERE id = ?${isAuthority ? "" : " AND user_id = ?"}`;
    const db = await getSql();
    const row = (
      isAuthority
        ? await db.prepare(sql).get(shipmentId)
        : await db.prepare(sql).get(shipmentId, viewerUserId)
    ) as InvoiceDocumentShipment | undefined;
    if (!row) return { error: "Shipment not found." };
    if (row.lane !== "INTERNATIONAL") {
      return { error: "Digital invoices apply to international shipments only." };
    }
    return { shipment: row, invoice: await getInvoiceForShipment(shipmentId) };
  } catch (error) {
    console.error(
      "[invoice-document.ts:getInvoiceDocument]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not load digital invoice." };
  }
}
