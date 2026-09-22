"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  invoiceExportReasons,
  invoiceTotal,
  invoiceTotalUnits,
  invoiceTotalWeightKg,
  type CommercialInvoice,
} from "@/lib/domain/invoice";
import {
  emptyInvoiceLine,
  invoiceLineIncomplete,
  InvoiceLineFields,
  type LineDraft,
} from "./InvoiceLineFields";

const FIELD =
  "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-sm text-[var(--off-white)] outline-none focus:border-[var(--teal)]";

function toDraft(initial: CommercialInvoice | null): LineDraft[] {
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

export function InvoiceEditor({
  shipmentId,
  currency,
  initial,
}: {
  shipmentId: string;
  currency: string;
  initial: CommercialInvoice | null;
}) {
  const [exportReason, setExportReason] = useState(initial?.exportReason ?? "SALE");
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
    setPending(true);
    try {
      const response = await fetch(`/api/bookings/${shipmentId}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          exportReason,
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
      <label className="block text-sm text-[var(--muted)]">
        Export reason
        <select className={FIELD} value={exportReason} onChange={(e) => setExportReason(e.target.value)}>
          {invoiceExportReasons.map((reason) => (
            <option key={reason} value={reason}>{reason}</option>
          ))}
        </select>
      </label>
      {lines.map((line, index) => (
        <InvoiceLineFields key={index} line={line} index={index} currency={currency} field={FIELD}
          onChange={(patch) => updateLine(index, patch)}
          onCopy={() => setLines((prev) => [...prev, { ...prev[index] }])}
          onRemove={() => setLines((prev) => prev.filter((_, i) => i !== index))}
          canRemove={lines.length > 1}
        />
      ))}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] px-3 py-2 text-xs text-[var(--muted)]">
        <span>Total units {totalUnits}</span>
        <span>Total weight {totalWeight.toFixed(3)} kg</span>
        <span className="text-[var(--gold)]">Total value {currency} {totalValue.toFixed(2)}</span>
        <button type="button" onClick={() => setLines((prev) => [...prev, emptyInvoiceLine()])}
          className="ml-auto rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)]">
          Add another item
        </button>
      </div>
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
