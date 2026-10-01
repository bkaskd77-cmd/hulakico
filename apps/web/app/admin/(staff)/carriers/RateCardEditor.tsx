"use client";

import { useState, type FormEvent } from "react";
import { FIELD, LABEL } from "@/app/admin/(staff)/homepage/AdminFields";

export type EditableRate = {
  id: string;
  serviceName: string;
  zoneLabel: string;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
};

type SaveInput = {
  id: string;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
};

export function RateCardEditor({
  rates,
  saveAction,
}: {
  rates: EditableRate[];
  saveAction: (input: SaveInput) => Promise<{ ok: true } | { error: string }>;
}) {
  if (rates.length === 0) {
    return <p className="mt-3 text-sm text-[var(--muted)]">No rate cards on this carrier.</p>;
  }
  return (
    <ul className="mt-4 space-y-3">
      {rates.map((rate) => (
        <RateRow key={rate.id} rate={rate} saveAction={saveAction} />
      ))}
    </ul>
  );
}

function RateRow({
  rate,
  saveAction,
}: {
  rate: EditableRate;
  saveAction: (input: SaveInput) => Promise<{ ok: true } | { error: string }>;
}) {
  const [currency, setCurrency] = useState(rate.currency);
  const [baseAmount, setBaseAmount] = useState(String(rate.baseAmount));
  const [perKgAmount, setPerKgAmount] = useState(String(rate.perKgAmount));
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const result = await saveAction({
        id: rate.id,
        currency,
        baseAmount: Number(baseAmount),
        perKgAmount: Number(perKgAmount),
      });
      setMessage("error" in result ? result.error : "Saved.");
    } catch (error) {
      console.error("[RateCardEditor.tsx:onSubmit]", error instanceof Error ? error.message : error);
      setMessage("Could not save the rate card.");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] p-3">
      <p className="text-sm text-[var(--off-white)]">
        {rate.serviceName} · {rate.zoneLabel}
      </p>
      <form onSubmit={onSubmit} className="mt-2 grid gap-2 sm:grid-cols-4 sm:items-end">
        <label className="block">
          <span className={LABEL}>Currency</span>
          <select className={FIELD} value={currency} onChange={(event) => setCurrency(event.target.value)}>
            <option value="NPR">NPR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label className="block">
          <span className={LABEL}>First 0.5 kg</span>
          <input className={FIELD} inputMode="decimal" value={baseAmount} onChange={(event) => setBaseAmount(event.target.value)} required />
        </label>
        <label className="block">
          <span className={LABEL}>Per extra kg</span>
          <input className={FIELD} inputMode="decimal" value={perKgAmount} onChange={(event) => setPerKgAmount(event.target.value)} required />
        </label>
        <button type="submit" disabled={pending} className="rounded-md bg-[#ffcc00] px-3 py-2.5 text-sm font-semibold text-[#191919] disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      {message ? <p className="mt-2 text-xs text-[var(--muted)]">{message}</p> : null}
    </li>
  );
}
