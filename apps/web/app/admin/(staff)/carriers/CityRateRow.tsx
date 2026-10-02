"use client";

import { useState, type FormEvent } from "react";
import { FIELD, LABEL } from "@/app/admin/(staff)/homepage/AdminFields";
import { saveRateAction } from "@/app/admin/(staff)/carriers/actions";

export type DeskRate = {
  id: string;
  placeName: string;
  lane: string;
  serviceLabel: string;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
};

const SAVE = "rounded-md bg-[#ffcc00] px-3 py-2.5 text-sm font-semibold text-[#191919] disabled:opacity-60";

export function CityRateRow({ rate }: { rate: DeskRate }) {
  const [currency, setCurrency] = useState(rate.currency);
  const [baseAmount, setBaseAmount] = useState(String(rate.baseAmount));
  const [perKgAmount, setPerKgAmount] = useState(String(rate.perKgAmount));
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const lane = rate.lane === "INTERNATIONAL" ? "International" : "National";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await saveRateAction({
      id: rate.id,
      currency,
      baseAmount: Number(baseAmount),
      perKgAmount: Number(perKgAmount),
    });
    setPending(false);
    setMessage("error" in result ? result.error : "Saved.");
  }

  return (
    <li className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] p-3">
      <p className="text-sm text-[var(--off-white)]">{rate.placeName} · {rate.serviceLabel} · {lane}</p>
      <form onSubmit={onSubmit} className="mt-2 grid gap-2 sm:grid-cols-4 sm:items-end">
        <label className="block"><span className={LABEL}>Currency</span>
          <select className={FIELD} value={currency} onChange={(event) => setCurrency(event.target.value)}>
            <option value="NPR">NPR</option><option value="USD">USD</option>
          </select>
        </label>
        <label className="block"><span className={LABEL}>First 0.5 kg</span>
          <input className={FIELD} inputMode="decimal" required value={baseAmount} onChange={(event) => setBaseAmount(event.target.value)} />
        </label>
        <label className="block"><span className={LABEL}>Per extra kg</span>
          <input className={FIELD} inputMode="decimal" required value={perKgAmount} onChange={(event) => setPerKgAmount(event.target.value)} />
        </label>
        <button type="submit" disabled={pending} className={SAVE}>{pending ? "Saving…" : "Save"}</button>
      </form>
      {message ? <p className="mt-2 text-xs text-[var(--muted)]">{message}</p> : null}
    </li>
  );
}
