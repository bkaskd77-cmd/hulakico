"use client";

import { invoiceLineUnits } from "@/lib/domain/invoice";
import { BOOKING_COUNTRIES } from "./countries";

export type LineDraft = {
  description: string;
  quantity: string;
  unit: (typeof invoiceLineUnits)[number];
  unitValue: string;
  weightKg: string;
  hsCode: string;
  countryOfOrigin: string;
};

export function emptyInvoiceLine(): LineDraft {
  return {
    description: "",
    quantity: "1",
    unit: "PCS",
    unitValue: "",
    weightKg: "",
    hsCode: "",
    countryOfOrigin: "",
  };
}

const LINK =
  "text-xs font-semibold text-[var(--teal)] underline-offset-2 hover:underline";

/** One customs line item: description, unit, qty, value, weight, HS, origin. */
export function InvoiceLineFields({
  line,
  index,
  currency,
  field,
  onChange,
  onCopy,
  onRemove,
  canRemove,
}: {
  line: LineDraft;
  index: number;
  currency: string;
  field: string;
  onChange: (patch: Partial<LineDraft>) => void;
  onCopy: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const originKnown = BOOKING_COUNTRIES.some((c) => c.code === line.countryOfOrigin);

  return (
    <div className="grid gap-2 rounded-md border border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] p-3 sm:grid-cols-2">
      <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
        Item {index + 1}
      </p>
      <label className="sm:col-span-2 text-sm text-[var(--muted)]">
        What is the item?
        <input className={field} value={line.description} required minLength={2}
          onChange={(e) => onChange({ description: e.target.value })} />
      </label>
      <label className="text-sm text-[var(--muted)]">
        Commodity / HS code
        <input className={field} value={line.hsCode}
          onChange={(e) => onChange({ hsCode: e.target.value })} />
      </label>
      <label className="text-sm text-[var(--muted)]">
        Where was it made?
        <select className={field} value={line.countryOfOrigin}
          onChange={(e) => onChange({ countryOfOrigin: e.target.value })}>
          <option value="">Select country</option>
          {!originKnown && line.countryOfOrigin ? (
            <option value={line.countryOfOrigin}>{line.countryOfOrigin}</option>
          ) : null}
          {BOOKING_COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>{country.name}</option>
          ))}
        </select>
      </label>
      <label className="text-sm text-[var(--muted)]">
        Quantity
        <input className={field} type="number" min="0.01" step="0.01" required
          value={line.quantity} onChange={(e) => onChange({ quantity: e.target.value })} />
      </label>
      <label className="text-sm text-[var(--muted)]">
        Units
        <select className={field} value={line.unit}
          onChange={(e) => onChange({ unit: e.target.value as LineDraft["unit"] })}>
          {invoiceLineUnits.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </label>
      <label className="text-sm text-[var(--muted)]">
        Value (per item, {currency})
        <input className={field} type="number" min="0" step="0.01" required
          value={line.unitValue} onChange={(e) => onChange({ unitValue: e.target.value })} />
      </label>
      <label className="text-sm text-[var(--muted)]">
        Weight (per item, kg)
        <input className={field} type="number" min="0.001" step="0.001"
          value={line.weightKg} onChange={(e) => onChange({ weightKg: e.target.value })} />
      </label>
      <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1">
        <button type="button" onClick={onCopy} className={LINK}>Copy item</button>
        {canRemove ? (
          <button type="button" onClick={onRemove} className={LINK}>Remove item</button>
        ) : null}
      </div>
    </div>
  );
}
