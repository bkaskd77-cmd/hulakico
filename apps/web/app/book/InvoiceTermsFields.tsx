"use client";

import { EXPORT_PURPOSES, INCOTERMS, invoiceTitle, type ExportPurpose, type Incoterm } from "@/lib/domain/invoice-terms";

export type InvoiceTerms = {
  purpose: ExportPurpose;
  incoterm: Incoterm;
  exporterTaxId: string;
  importerTaxId: string;
  freightCharge: string;
  insuranceCharge: string;
  declaredBy: string;
  agreed: boolean;
};

/** Invoice header fields customs need besides the items: purpose, duty terms, IDs, charges, declaration. */
export function InvoiceTermsFields({ terms, currency, field, onChange, signedOnSave }: {
  terms: InvoiceTerms;
  currency: string;
  field: string;
  onChange: (patch: Partial<InvoiceTerms>) => void;
  signedOnSave: boolean;
}) {
  const label = "block text-sm text-[var(--muted)]";
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Why are you sending it?<span className="text-[var(--danger)]" aria-hidden> *</span>
          <select className={field} value={terms.purpose} onChange={(e) => onChange({ purpose: e.target.value as ExportPurpose })}>
            {EXPORT_PURPOSES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
          <span className="mt-1 block text-xs">Document: {invoiceTitle(terms.purpose)}{terms.purpose === "SALE" ? "" : " (no sale)"}</span>
        </label>
        <fieldset className="text-sm text-[var(--muted)]">
          <legend>Who pays import duties and taxes?<span className="text-[var(--danger)]" aria-hidden> *</span></legend>
          {INCOTERMS.map((item) => (
            <label key={item.key} className="mt-1.5 flex items-start gap-2 text-[var(--off-white)]">
              <input type="radio" name="incoterm" value={item.key} checked={terms.incoterm === item.key} onChange={() => onChange({ incoterm: item.key })} className="mt-1" />
              <span className="text-xs">{item.label}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Sender PAN / VAT number {terms.purpose === "SALE" ? "(needed for business exports)" : "(optional)"}
          <input className={field} value={terms.exporterTaxId} maxLength={40} onChange={(e) => onChange({ exporterTaxId: e.target.value })} />
        </label>
        <label className={label}>
          Receiver tax / ID number (optional)
          <input className={field} value={terms.importerTaxId} maxLength={40} placeholder="e.g. VAT, EORI, GSTIN, CPF" onChange={(e) => onChange({ importerTaxId: e.target.value })} />
        </label>
        <label className={label}>
          Freight charge ({currency}, optional)
          <input className={field} inputMode="decimal" value={terms.freightCharge} onChange={(e) => onChange({ freightCharge: e.target.value })} />
        </label>
        <label className={label}>
          Insurance ({currency}, optional)
          <input className={field} inputMode="decimal" value={terms.insuranceCharge} onChange={(e) => onChange({ insuranceCharge: e.target.value })} />
        </label>
      </div>
      <div className="rounded-md border border-[color-mix(in_srgb,var(--gold)_45%,transparent)] p-3">
        <label className="flex items-start gap-2 text-xs text-[var(--off-white)]">
          <input type="checkbox" checked={terms.agreed} onChange={(e) => onChange({ agreed: e.target.checked })} className="mt-0.5" />
          <span>I declare that the information on this invoice is true and correct, that the goods are as described, and that the values are the real prices paid or the fair value.</span>
        </label>
        <label className={`${label} mt-2`}>
          Your full name (signature)<span className="text-[var(--danger)]" aria-hidden> *</span>
          <input className={field} value={terms.declaredBy} maxLength={80} autoComplete="name" onChange={(e) => onChange({ declaredBy: e.target.value })} />
        </label>
        {signedOnSave ? <p className="mt-1 text-xs text-[var(--muted)]">Saved with today&apos;s date as your signed declaration.</p> : null}
      </div>
    </div>
  );
}
