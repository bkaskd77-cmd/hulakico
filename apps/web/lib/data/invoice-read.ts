import { getSql } from "@/lib/sql";
import { invoiceTotal, lineTotal, type CommercialInvoice, type CommercialInvoiceLine } from "@/lib/domain/invoice";
import { purposeFromLegacy } from "@/lib/domain/invoice-terms";

type InvoiceRow = {
  id: string;
  shipment_id: string;
  currency: string;
  export_reason: string;
  purpose: string | null;
  incoterm: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  exporter_tax_id: string | null;
  importer_tax_id: string | null;
  freight_charge: number | null;
  insurance_charge: number | null;
  declared_by: string | null;
  declared_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type LineRow = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_value: number;
  weight_kg: number | null;
  hs_code: string | null;
  country_of_origin: string | null;
  sort_order: number;
};

async function loadLines(invoiceId: string): Promise<CommercialInvoiceLine[]> {
  const rows = (await (await getSql())
    .prepare(
      `SELECT * FROM commercial_invoice_lines
       WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC`,
    )
    .all(invoiceId)) as LineRow[];
  return rows.map((line) => ({
    id: line.id,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unitValue: line.unit_value,
    lineTotal: lineTotal({ quantity: line.quantity, unitValue: line.unit_value }),
    weightKg: line.weight_kg,
    hsCode: line.hs_code,
    countryOfOrigin: line.country_of_origin,
    sortOrder: line.sort_order,
  }));
}

export async function getInvoiceForShipment(
  shipmentId: string,
): Promise<CommercialInvoice | null> {
  try {
    const row = (await (await getSql())
      .prepare(`SELECT * FROM commercial_invoices WHERE shipment_id = ?`)
      .get(shipmentId)) as InvoiceRow | undefined;
    if (!row) return null;
    const lines = await loadLines(row.id);
    return {
      id: row.id,
      shipmentId: row.shipment_id,
      currency: row.currency,
      exportReason: row.export_reason,
      purpose: purposeFromLegacy(row.purpose, row.export_reason),
      incoterm: row.incoterm ?? "DAP",
      invoiceNumber: row.invoice_number,
      invoiceDate: row.invoice_date,
      exporterTaxId: row.exporter_tax_id,
      importerTaxId: row.importer_tax_id,
      freightCharge: Number(row.freight_charge ?? 0),
      insuranceCharge: Number(row.insurance_charge ?? 0),
      declaredBy: row.declared_by,
      declaredAt: row.declared_at,
      notes: row.notes,
      totalValue: invoiceTotal(lines),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lines,
    };
  } catch (error) {
    console.error(
      "[invoices.ts:getInvoiceForShipment]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
