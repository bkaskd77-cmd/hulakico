/**
 * Customs terms for the invoice: why the goods are exported and who pays destination duties.
 * Each purpose maps to the older stored export_reason so existing invoices keep working.
 */
export const EXPORT_PURPOSES = [
  { key: "SALE", label: "Sale — commercial goods", legacy: "SALE", proforma: false },
  { key: "GIFT", label: "Gift — no payment", legacy: "GIFT", proforma: true },
  { key: "SAMPLE", label: "Commercial sample — no charge", legacy: "SAMPLE", proforma: true },
  { key: "PERSONAL", label: "Personal effects / own use", legacy: "OTHER", proforma: true },
  { key: "REPAIR", label: "Repair or warranty return", legacy: "RETURN", proforma: true },
  { key: "RETURN", label: "Return of goods to the seller", legacy: "RETURN", proforma: true },
  { key: "TEMPORARY", label: "Temporary export — exhibition or event", legacy: "OTHER", proforma: true },
  { key: "OTHER", label: "Other (explain in notes)", legacy: "OTHER", proforma: true },
] as const;

export type ExportPurpose = (typeof EXPORT_PURPOSES)[number]["key"];
export const EXPORT_PURPOSE_KEYS = EXPORT_PURPOSES.map((item) => item.key) as [ExportPurpose, ...ExportPurpose[]];

export const INCOTERMS = [
  { key: "DAP", label: "DAP — receiver pays duties and taxes on arrival", document: "DAP — Delivered At Place (receiver pays duties and taxes)" },
  { key: "DDP", label: "DDP — sender pays duties and taxes (estimate added to the price)", document: "DDP — Delivered Duty Paid (sender pays duties and taxes)" },
] as const;

export type Incoterm = (typeof INCOTERMS)[number]["key"];
export const INCOTERM_KEYS = INCOTERMS.map((item) => item.key) as [Incoterm, ...Incoterm[]];

function purposeOf(key: string) {
  return EXPORT_PURPOSES.find((item) => item.key === key);
}

/** Purpose for an invoice saved before purposes existed (from its export_reason). */
export function purposeFromLegacy(purpose: string | null, legacyReason: string): ExportPurpose {
  if (purpose && purposeOf(purpose)) return purpose as ExportPurpose;
  return (purposeOf(legacyReason)?.key ?? "OTHER") as ExportPurpose;
}

export function legacyReasonFor(purpose: ExportPurpose): string {
  return purposeOf(purpose)?.legacy ?? "OTHER";
}

export function purposeLabel(purpose: string): string {
  return purposeOf(purpose)?.label ?? purpose;
}

export function incotermLabel(term: string): string {
  return INCOTERMS.find((item) => item.key === term)?.label ?? term;
}

/** Incoterm as written on the printed invoice, in customs terms. */
export function incotermDocumentLabel(term: string): string {
  return INCOTERMS.find((item) => item.key === term)?.document ?? term;
}

/** A sale needs a commercial invoice; goods sent without payment go on a proforma invoice. */
export function invoiceTitle(purpose: string): "Commercial Invoice" | "Proforma Invoice" {
  return purposeOf(purpose)?.proforma ? "Proforma Invoice" : "Commercial Invoice";
}

/** Stable invoice number from the save date and shipment id, e.g. HKI-20261025-1AA3A3. */
export function newInvoiceNumber(shipmentId: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `HKI-${day}-${shipmentId.slice(-6).toUpperCase()}`;
}
