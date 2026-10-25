import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import { commercialInvoiceSchema, type CommercialInvoice, type CommercialInvoiceFormInput } from "@/lib/domain/invoice";
import { legacyReasonFor, newInvoiceNumber } from "@/lib/domain/invoice-terms";
import { getInvoiceForShipment } from "@/lib/data/invoice-read";

export { getInvoiceForShipment } from "@/lib/data/invoice-read";

export async function upsertCommercialInvoice(
  input: CommercialInvoiceFormInput,
): Promise<{ invoice: CommercialInvoice } | { error: string }> {
  try {
    const parsed = commercialInvoiceSchema.safeParse(input);
    if (!parsed.success) {
      const field = String(parsed.error.issues[0]?.path[0] ?? "");
      if (field === "declaredBy") return { error: "Type your full name to sign the declaration." };
      if (field === "lines") return { error: "Check the items: each needs a description, HS code, origin, quantity, value, and weight." };
      return { error: "Some invoice details are not valid. Check the highlighted fields." };
    }
    const data = parsed.data;
    const db = await getSql();
    const shipment = (await db
      .prepare(`SELECT id, lane FROM shipments WHERE id = ?`)
      .get(data.shipmentId)) as { id: string; lane: string } | undefined;
    if (!shipment) return { error: "Shipment not found." };
    if (shipment.lane !== "INTERNATIONAL") {
      return { error: "Commercial invoices are for international shipments only." };
    }

    const existing = (await db
      .prepare(`SELECT id, invoice_number, invoice_date FROM commercial_invoices WHERE shipment_id = ?`)
      .get(data.shipmentId)) as { id: string; invoice_number: string | null; invoice_date: string | null } | undefined;
    const now = new Date().toISOString();
    const invoiceId = existing?.id ?? newId("cinv");
    const notes = data.notes?.trim() || null;
    // Number and date are fixed at the first save so a printed invoice never changes identity.
    const terms = [
      existing?.invoice_number ?? newInvoiceNumber(data.shipmentId), existing?.invoice_date ?? now.slice(0, 10),
      data.purpose, data.incoterm, data.exporterTaxId || null, data.importerTaxId || null,
      data.freightCharge ?? 0, data.insuranceCharge ?? 0, data.declaredBy, now,
    ];
    const exportReason = legacyReasonFor(data.purpose);

    await db.transaction(async (tx) => {
      if (existing) {
        await tx.prepare(
          `UPDATE commercial_invoices SET currency=?, export_reason=?, notes=?, updated_at=?,
             invoice_number=?, invoice_date=?, purpose=?, incoterm=?, exporter_tax_id=?, importer_tax_id=?,
             freight_charge=?, insurance_charge=?, declared_by=?, declared_at=? WHERE id=?`,
        ).run(data.currency, exportReason, notes, now, ...terms, invoiceId);
        await tx.prepare(`DELETE FROM commercial_invoice_lines WHERE invoice_id=?`).run(invoiceId);
      } else {
        await tx.prepare(
          `INSERT INTO commercial_invoices (id, shipment_id, currency, export_reason, notes, created_at, updated_at,
             invoice_number, invoice_date, purpose, incoterm, exporter_tax_id, importer_tax_id,
             freight_charge, insurance_charge, declared_by, declared_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        ).run(invoiceId, data.shipmentId, data.currency, exportReason, notes, now, now, ...terms);
      }
      const insertLine = tx.prepare(
        `INSERT INTO commercial_invoice_lines
           (id, invoice_id, description, quantity, unit, unit_value, weight_kg,
            hs_code, country_of_origin, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      );
      for (const [index, line] of data.lines.entries()) {
        await insertLine.run(
          newId("ciln"), invoiceId, line.description.trim(), line.quantity,
          line.unit, line.unitValue, line.weightKg ?? null,
          line.hsCode?.trim() || null,
          line.countryOfOrigin?.trim().toUpperCase() || null, index,
        );
      }
    });
    const invoice = await getInvoiceForShipment(data.shipmentId);
    if (!invoice) return { error: "Invoice saved but could not be reloaded." };
    return { invoice };
  } catch (error) {
    console.error(
      "[invoices.ts:upsertCommercialInvoice]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not save commercial invoice." };
  }
}
