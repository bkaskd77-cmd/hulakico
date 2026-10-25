"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  invoiceTotal,
  invoiceTotalUnits,
  invoiceTotalWeightKg,
  type CommercialInvoice,
} from "@/lib/domain/invoice";
import { emptyInvoiceLine, invoiceLineIncomplete, InvoiceLineFields, type LineDraft } from "./InvoiceLineFields";
import { AiCustomsCheck } from "./AiCustomsCheck";
import { InvoiceUpload } from "./InvoiceUpload";
import { InvoiceTermsFields, type InvoiceTerms } from "./InvoiceTermsFields";
import { purposeLabel } from "@/lib/domain/invoice-terms";
import { termsFromInvoice, toDraft } from "./invoice-draft";

const FIELD =
  "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-sm text-[var(--off-white)] outline-none focus:border-[var(--teal)]";

export function InvoiceEditor({
  shipmentId, currency, initial, onSaved,
}: {
  shipmentId: string;
  currency: string;
  initial: CommercialInvoice | null;
  onSaved?: () => void; // after a successful save, e.g. to unlock payment
}) {
  const [terms, setTerms] = useState<InvoiceTerms>(() => termsFromInvoice(initial));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<LineDraft[]>(() => toDraft(initial));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const numeric = lines.map((line) => ({
    quantity: Number(line.quantity) || 0,
    unitValue: Number(line.unitValue) || 0,
    weightKg: line.weightKg.trim() ? Number(line.weightKg) : null,
  }));
  const totalUnits = invoiceTotalUnits(numeric);
  const totalWeight = invoiceTotalWeightKg(numeric);
  const totalValue = invoiceTotal(numeric);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (lines.some(invoiceLineIncomplete)) {
      setMessage("Every item needs description, HS code, origin, qty, value, and weight (kg).");
      return;
    }
    if (!terms.agreed || terms.declaredBy.trim().length < 2) {
      setMessage("Tick the declaration and type your full name to sign it.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/bookings/${shipmentId}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          purpose: terms.purpose,
          incoterm: terms.incoterm,
          exporterTaxId: terms.exporterTaxId.trim() || undefined,
          importerTaxId: terms.importerTaxId.trim() || undefined,
          freightCharge: Number(terms.freightCharge) || 0,
          insuranceCharge: Number(terms.insuranceCharge) || 0,
          declaredBy: terms.declaredBy.trim(),
          notes: notes.trim() || undefined,
          lines: lines.map((line) => ({
            description: line.description,
            quantity: Number(line.quantity),
            unit: line.unit,
            unitValue: Number(line.unitValue),
            weightKg: Number(line.weightKg),
            hsCode: line.hsCode.trim(),
            countryOfOrigin: line.countryOfOrigin.trim().toUpperCase(),
          })),
        }),
      });
      const data = await response.json();
      if (response.ok) onSaved?.();
      setMessage(
        response.ok
          ? `Saved · total ${currency} ${Number(data.invoice.totalValue).toFixed(2)}`
          : data.error || "Could not save invoice.",
      );
    } catch (error) {
      console.error("[InvoiceEditor.tsx:save]", error);
      setMessage("Could not save invoice.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-8 space-y-4 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-6">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Commercial invoice</p>
      <p className="-mt-2 text-xs text-[var(--muted)]">International — all item fields required ({currency}).</p>
      <Link href={`/book/invoice/${shipmentId}`} className="inline-block text-xs font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
        Open digital invoice document
      </Link>
      {lines.map((line, index) => (
        <InvoiceLineFields key={index} line={line} index={index} currency={currency} field={FIELD}
          onChange={(patch) => updateLine(index, patch)}
          onCopy={() => setLines((prev) => [...prev, { ...prev[index] }])}
          onRemove={() => setLines((prev) => prev.filter((_, i) => i !== index))}
          canRemove={lines.length > 1}
        />
      ))}
      <AiCustomsCheck shipmentId={shipmentId} currency={currency} exportReason={purposeLabel(terms.purpose)} lines={lines} onApply={updateLine} />
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] px-3 py-2 text-xs text-[var(--muted)]">
        <span>Total units {totalUnits}</span>
        <span>Total weight {totalWeight.toFixed(3)} kg</span>
        <span className="text-[var(--gold)]">Total value {currency} {totalValue.toFixed(2)}</span>
        <button type="button" onClick={() => setLines((prev) => [...prev, emptyInvoiceLine()])}
          className="ml-auto rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)]">
          Add another item
        </button>
      </div>
      <InvoiceTermsFields terms={terms} currency={currency} field={FIELD} signedOnSave={terms.agreed}
        onChange={(patch) => setTerms((prev) => ({ ...prev, ...patch }))} />
      <InvoiceUpload shipmentId={shipmentId} />
      <label className="block text-sm text-[var(--muted)]">
        Notes
        <input className={FIELD} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button type="submit" disabled={pending}
        className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)] disabled:opacity-60">
        {pending ? "Saving…" : "Save invoice"}
      </button>
      {message ? <p className="text-xs text-[var(--teal)]">{message}</p> : null}
    </form>
  );
}
