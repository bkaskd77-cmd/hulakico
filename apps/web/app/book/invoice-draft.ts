"use client";

import type { CommercialInvoice } from "@/lib/domain/invoice";
import { purposeFromLegacy, type Incoterm } from "@/lib/domain/invoice-terms";
import { emptyInvoiceLine, type LineDraft } from "./InvoiceLineFields";
import type { InvoiceTerms } from "./InvoiceTermsFields";

/** Saved invoice lines as editable form rows (one empty row for a new invoice). */
export function toDraft(initial: CommercialInvoice | null): LineDraft[] {
  if (!initial?.lines.length) return [emptyInvoiceLine()];
  return initial.lines.map((line) => ({
    description: line.description,
    quantity: String(line.quantity),
    unit: (["PCS", "BOX", "KG", "SET", "PAIR"].includes(line.unit)
      ? line.unit
      : "PCS") as LineDraft["unit"],
    unitValue: String(line.unitValue),
    weightKg: line.weightKg != null ? String(line.weightKg) : "",
    hsCode: line.hsCode ?? "",
    countryOfOrigin: line.countryOfOrigin ?? "",
  }));
}

/** Saved invoice header as editable terms; invoices from before the declaration start unsigned. */
export function termsFromInvoice(initial: CommercialInvoice | null): InvoiceTerms {
  return {
    purpose: purposeFromLegacy(initial?.purpose ?? null, initial?.exportReason ?? "SALE"),
    incoterm: (initial?.incoterm === "DDP" ? "DDP" : "DAP") as Incoterm,
    exporterTaxId: initial?.exporterTaxId ?? "", importerTaxId: initial?.importerTaxId ?? "",
    freightCharge: initial?.freightCharge ? String(initial.freightCharge) : "",
    insuranceCharge: initial?.insuranceCharge ? String(initial.insuranceCharge) : "",
    declaredBy: initial?.declaredBy ?? "", agreed: Boolean(initial?.declaredAt),
  };
}
