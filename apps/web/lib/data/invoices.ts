import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import {
  commercialInvoiceSchema,
  invoiceTotal,
  lineTotal,
  type CommercialInvoice,
  type CommercialInvoiceInput,
  type CommercialInvoiceLine,
} from "@/lib/domain/invoice";

type InvoiceRow = {
  id: string;
  shipment_id: string;
  currency: string;
  export_reason: string;
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

export async function upsertCommercialInvoice(
  input: CommercialInvoiceInput,
): Promise<{ invoice: CommercialInvoice } | { error: string }> {
  try {
    const parsed = commercialInvoiceSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid commercial invoice details." };
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
      .prepare(`SELECT id FROM commercial_invoices WHERE shipment_id = ?`)
      .get(data.shipmentId)) as { id: string } | undefined;
    const now = new Date().toISOString();
    const invoiceId = existing?.id ?? newId("cinv");
    const notes = data.notes?.trim() || null;

    await db.transaction(async (tx) => {
      if (existing) {
        await tx.prepare(
          `UPDATE commercial_invoices SET currency=?, export_reason=?, notes=?, updated_at=? WHERE id=?`,
        ).run(data.currency, data.exportReason, notes, now, invoiceId);
        await tx.prepare(`DELETE FROM commercial_invoice_lines WHERE invoice_id=?`).run(invoiceId);
      } else {
        await tx.prepare(
          `INSERT INTO commercial_invoices (id, shipment_id, currency, export_reason, notes, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?)`,
        ).run(invoiceId, data.shipmentId, data.currency, data.exportReason, notes, now, now);
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
