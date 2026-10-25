"use client";

import { useState, type FormEvent } from "react";
import { FIELD, LABEL } from "@/app/admin/(staff)/homepage/AdminFields";
import { removeRateAction, saveRateAction } from "@/app/admin/(staff)/carriers/actions";
import { countryName } from "@/app/book/countries";

export type DeskRate = {
  id: string;
  placeName: string;
  lane: string;
  serviceLabel: string;
  country: string;
  postalCodes: string;
  /** Why this saved rate can never be used (e.g. a Nepal city saved as International). */
  problem: string | null;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
};

const SAVE = "rounded-md bg-[#ffcc00] px-3 py-2.5 text-sm font-semibold text-[#191919] disabled:opacity-60";
const REMOVE = "rounded-md border border-[var(--danger)] px-3 py-2 text-xs font-semibold text-[var(--danger)] disabled:opacity-60";

export function CityRateRow({ rate }: { rate: DeskRate }) {
  const [currency, setCurrency] = useState(rate.currency);
  const [baseAmount, setBaseAmount] = useState(String(rate.baseAmount));
  const [perKgAmount, setPerKgAmount] = useState(String(rate.perKgAmount));
  const [postalCodes, setPostalCodes] = useState(rate.postalCodes);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const lane = rate.lane === "INTERNATIONAL" ? "International" : "National";
  const where = rate.country ? countryName(rate.country) : "No country";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await saveRateAction({ id: rate.id, currency, postalCodes, baseAmount: Number(baseAmount), perKgAmount: Number(perKgAmount) });
    setPending(false);
    setMessage("error" in result ? result.error : "Saved.");
  }

  async function remove() {
    if (!confirmRemove) return setConfirmRemove(true);
    setPending(true);
    const result = await removeRateAction(rate.id);
    setPending(false);
    setMessage("error" in result ? result.error : "Removed.");
  }

  return (
    <li className={`rounded-md border p-3 ${rate.problem ? "border-[var(--danger)]" : "border-[color-mix(in_srgb,var(--off-white)_12%,transparent)]"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--off-white)]">{rate.placeName} · {where} · {rate.serviceLabel} · {lane}</p>
        <button type="button" onClick={remove} disabled={pending} className={REMOVE}>{confirmRemove ? "Click again to remove" : "Remove"}</button>
      </div>
      {rate.problem ? <p role="alert" className="mt-1 text-xs font-semibold text-[var(--danger)]">Not used for pricing: {rate.problem}</p> : null}
      <form onSubmit={onSubmit} className="mt-2 grid gap-2 sm:grid-cols-5 sm:items-end">
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
        <label className="block"><span className={LABEL}>Postal codes</span>
          <input className={FIELD} value={postalCodes} placeholder="e.g. 44600, 446*" onChange={(event) => setPostalCodes(event.target.value)} />
        </label>
        <button type="submit" disabled={pending} className={SAVE}>{pending ? "Saving…" : "Save"}</button>
      </form>
      {message ? <p className="mt-2 text-xs text-[var(--muted)]">{message}</p> : null}
    </li>
  );
}
