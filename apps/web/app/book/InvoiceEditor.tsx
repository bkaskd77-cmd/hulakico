"use client";

import { FormEvent, useState } from "react";
import { invoiceExportReasons, type CommercialInvoice } from "@/lib/domain/invoice";

const FIELD =
  "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-sm text-[var(--off-white)] outline-none focus:border-[var(--teal)]";

type LineDraft = {
  description: string;
  quantity: string;
  unitValue: string;
  hsCode: string;
  countryOfOrigin: string;
};

const emptyLine = (): LineDraft => ({
  description: "",
  quantity: "1",
  unitValue: "",
  hsCode: "",
  countryOfOrigin: "",
});

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
  const [lines, setLines] = useState<LineDraft[]>(
    initial?.lines.length
      ? initial.lines.map((line) => ({
          description: line.description,
          quantity: String(line.quantity),
          unitValue: String(line.unitValue),
          hsCode: line.hsCode ?? "",
          countryOfOrigin: line.countryOfOrigin ?? "",
        }))
      : [emptyLine()],
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
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
            unit: "PCS",
            unitValue: Number(line.unitValue),
            hsCode: line.hsCode.trim() || undefined,
            countryOfOrigin: line.countryOfOrigin.trim() || undefined,
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
      <p className="-mt-2 text-xs text-[var(--muted)]">International only — goods for customs ({currency}).</p>
      <label className="block text-sm text-[var(--muted)]">
        Export reason
        <select className={FIELD} value={exportReason} onChange={(e) => setExportReason(e.target.value)}>
          {invoiceExportReasons.map((reason) => (
            <option key={reason} value={reason}>{reason}</option>
          ))}
        </select>
      </label>
      {lines.map((line, index) => (
        <div key={index} className="grid gap-2 rounded-md border border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] p-3 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm text-[var(--muted)]">
            Description
            <input className={FIELD} value={line.description} required minLength={2}
              onChange={(e) => updateLine(index, { description: e.target.value })} />
          </label>
          <label className="text-sm text-[var(--muted)]">
            Qty
            <input className={FIELD} type="number" min="0.01" step="0.01" required value={line.quantity}
              onChange={(e) => updateLine(index, { quantity: e.target.value })} />
          </label>
          <label className="text-sm text-[var(--muted)]">
            Unit value ({currency})
            <input className={FIELD} type="number" min="0" step="0.01" required value={line.unitValue}
              onChange={(e) => updateLine(index, { unitValue: e.target.value })} />
          </label>
          <label className="text-sm text-[var(--muted)]">
            HS code
            <input className={FIELD} value={line.hsCode}
              onChange={(e) => updateLine(index, { hsCode: e.target.value })} />
          </label>
          <label className="text-sm text-[var(--muted)]">
            Origin (ISO)
            <input className={FIELD} value={line.countryOfOrigin} maxLength={2} placeholder="NP"
              onChange={(e) => updateLine(index, { countryOfOrigin: e.target.value.toUpperCase() })} />
          </label>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setLines((prev) => [...prev, emptyLine()])}
          className="rounded-md border border-[var(--teal)] px-3 py-1.5 text-xs text-[var(--teal)]">Add line</button>
        {lines.length > 1 ? (
          <button type="button" onClick={() => setLines((prev) => prev.slice(0, -1))}
            className="rounded-md border border-[var(--muted)] px-3 py-1.5 text-xs text-[var(--muted)]">Remove last</button>
        ) : null}
        <button type="submit" disabled={pending}
          className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)] disabled:opacity-60">
          {pending ? "Saving…" : "Save invoice"}
        </button>
      </div>
      <label className="block text-sm text-[var(--muted)]">
        Notes
        <input className={FIELD} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      {message ? <p className="text-xs text-[var(--teal)]">{message}</p> : null}
    </form>
  );
}
