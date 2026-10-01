"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { FIELD, LABEL } from "@/app/admin/(staff)/homepage/AdminFields";

const RATE_ZONES = ["valley", "major_city", "nationwide", "india", "gulf", "east_asia", "europe", "americas", "oceania", "world"] as const;

export type EditableRate = {
  id: string;
  zoneLabel: string;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
};

export type EditableService = { id: string; name: string; rates: EditableRate[] };

type Money = { currency: string; baseAmount: number; perKgAmount: number };
type SaveInput = Money & { id: string };
type AddInput = Money & { carrierServiceId: string; zoneLabel: string };

const SAVE = "rounded-md bg-[#ffcc00] px-3 py-2.5 text-sm font-semibold text-[#191919] disabled:opacity-60";

export function RateCardEditor({
  services,
  saveAction,
  addAction,
}: {
  services: EditableService[];
  saveAction: (input: SaveInput) => Promise<{ ok: true } | { error: string }>;
  addAction: (input: AddInput) => Promise<{ ok: true } | { error: string }>;
}) {
  return (
    <div className="mt-4 space-y-5">
      {services.map((service) => (
        <section key={service.id}>
          <p className="text-sm font-semibold text-[var(--off-white)]">{service.name}</p>
          <ul className="mt-2 space-y-3">
            {service.rates.map((rate) => (
              <RateRow key={rate.id} rate={rate} saveAction={saveAction} />
            ))}
          </ul>
          <AddRate serviceId={service.id} taken={service.rates.map((rate) => rate.zoneLabel)} addAction={addAction} />
        </section>
      ))}
    </div>
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
    const result = await saveAction({ id: rate.id, currency, baseAmount: Number(baseAmount), perKgAmount: Number(perKgAmount) });
    setPending(false);
    setMessage("error" in result ? result.error : "Saved.");
  }

  return (
    <li className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] p-3">
      <MoneyForm currency={currency} baseAmount={baseAmount} perKgAmount={perKgAmount} pending={pending} label={pending ? "Saving…" : "Save"} onCurrency={setCurrency} onBase={setBaseAmount} onPerKg={setPerKgAmount} onSubmit={onSubmit} extra={<p className="text-sm text-[var(--off-white)] sm:col-span-4">{rate.zoneLabel}</p>} />
      {message ? <p className="mt-2 text-xs text-[var(--muted)]">{message}</p> : null}
    </li>
  );
}

function AddRate({
  serviceId,
  taken,
  addAction,
}: {
  serviceId: string;
  taken: string[];
  addAction: (input: AddInput) => Promise<{ ok: true } | { error: string }>;
}) {
  const open = RATE_ZONES.filter((zone) => !taken.includes(zone));
  const [zoneLabel, setZoneLabel] = useState<string>(open[0] ?? "");
  const [currency, setCurrency] = useState("NPR");
  const [baseAmount, setBaseAmount] = useState("");
  const [perKgAmount, setPerKgAmount] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  if (open.length === 0) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await addAction({
      carrierServiceId: serviceId,
      zoneLabel,
      currency,
      baseAmount: Number(baseAmount),
      perKgAmount: Number(perKgAmount),
    });
    setPending(false);
    setMessage("error" in result ? result.error : "Added.");
  }

  return (
    <div className="mt-3 rounded-md border border-dashed border-[color-mix(in_srgb,var(--off-white)_20%,transparent)] p-3">
      <MoneyForm currency={currency} baseAmount={baseAmount} perKgAmount={perKgAmount} pending={pending} label={pending ? "Adding…" : "Add zone"} onCurrency={setCurrency} onBase={setBaseAmount} onPerKg={setPerKgAmount} onSubmit={onSubmit} extra={
        <label className="block sm:col-span-4">
          <span className={LABEL}>New zone</span>
          <select className={FIELD} value={zoneLabel} onChange={(event) => setZoneLabel(event.target.value)}>
            {open.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
        </label>
      } />
      {message ? <p className="mt-2 text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}

function MoneyForm({
  currency, baseAmount, perKgAmount, pending, label, extra, onCurrency, onBase, onPerKg, onSubmit,
}: {
  currency: string; baseAmount: string; perKgAmount: string; pending: boolean; label: string;
  extra?: ReactNode;
  onCurrency: (value: string) => void; onBase: (value: string) => void; onPerKg: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-2 grid gap-2 sm:grid-cols-4 sm:items-end">
      {extra}
      <label className="block"><span className={LABEL}>Currency</span>
        <select className={FIELD} value={currency} onChange={(event) => onCurrency(event.target.value)}>
          <option value="NPR">NPR</option><option value="USD">USD</option>
        </select>
      </label>
      <label className="block"><span className={LABEL}>First 0.5 kg</span>
        <input className={FIELD} inputMode="decimal" required value={baseAmount} onChange={(event) => onBase(event.target.value)} />
      </label>
      <label className="block"><span className={LABEL}>Per extra kg</span>
        <input className={FIELD} inputMode="decimal" required value={perKgAmount} onChange={(event) => onPerKg(event.target.value)} />
      </label>
      <button type="submit" disabled={pending} className={SAVE}>{label}</button>
    </form>
  );
}
