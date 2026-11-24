"use client";

import { useState } from "react";
import { invoiceLineUnits } from "@/lib/domain/invoice";
import type { LineDraft } from "./InvoiceLineFields";

type ReadLine = {
  description: string;
  quantity: number;
  unit: string;
  unitValue: number;
  weightKg: number | null;
  hsCode: string | null;
  countryOfOrigin: string | null;
};

function toUnit(unit: string): LineDraft["unit"] {
  const upper = unit.trim().toUpperCase();
  return (invoiceLineUnits as readonly string[]).includes(upper) ? (upper as LineDraft["unit"]) : "PCS";
}

/** Maps what the AI read into editable form lines; empty values stay empty for the customer to fill. */
function toDraft(line: ReadLine): LineDraft {
  return {
    description: line.description.trim().slice(0, 200),
    quantity: line.quantity > 0 ? String(line.quantity) : "1",
    unit: toUnit(line.unit),
    unitValue: line.unitValue > 0 ? String(line.unitValue) : "",
    weightKg: line.weightKg && line.weightKg > 0 ? String(line.weightKg) : "",
    hsCode: (line.hsCode ?? "").replace(/[^\d.]/g, "").slice(0, 12),
    countryOfOrigin: (line.countryOfOrigin ?? "").trim().toUpperCase().slice(0, 2),
  };
}

/** "Fill items from my invoice": Claude reads the uploaded file; the customer checks every line before saving. */
export function InvoiceAutofill({
  shipmentId,
  currency,
  hasItems,
  onFill,
}: {
  shipmentId: string;
  currency: string;
  hasItems: boolean;
  onFill: (lines: LineDraft[]) => void;
}) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState<{ text: string; error: boolean } | null>(null);

  async function read() {
    if (hasItems && !confirming) return setConfirming(true);
    setConfirming(false);
    setPending(true);
    setNote(null);
    try {
      const response = await fetch(`/api/bookings/${shipmentId}/invoice/autofill`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) return setNote({ text: data.error || "Could not read the invoice. You can fill in the lines yourself.", error: true });
      const lines = (data.invoice.lines as ReadLine[]).map(toDraft);
      onFill(lines);
      const other = data.invoice.currency && data.invoice.currency !== currency
        ? ` Your invoice is in ${data.invoice.currency}; convert the values to ${currency}.` : "";
      setNote({ text: `${lines.length} item(s) filled from your invoice. Check every line and fill anything left empty before saving.${other}`, error: false });
    } catch (error) {
      console.error("[InvoiceAutofill.tsx:read]", error instanceof Error ? error.message : error);
      setNote({ text: "Could not read the invoice. You can fill in the lines yourself.", error: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={read} disabled={pending}
        className="rounded-md bg-[var(--teal)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)] disabled:opacity-60">
        {pending ? "Reading your invoice…" : confirming ? "Replace the items above? Click again" : "Fill items from my invoice"}
      </button>
      <p className="mt-1 text-[11px] text-[var(--muted)]">AI reads your file and fills the items. Up to 3 readings per booking.</p>
      {note ? <p role={note.error ? "alert" : "status"} className={`mt-2 text-xs ${note.error ? "text-[var(--danger)]" : "text-[var(--teal)]"}`}>{note.text}</p> : null}
    </div>
  );
}
