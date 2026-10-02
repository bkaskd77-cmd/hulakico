"use client";

import { useState, type FormEvent } from "react";
import { FIELD, LABEL } from "@/app/admin/(staff)/homepage/AdminFields";
import { addCityRateAction } from "@/app/admin/(staff)/carriers/actions";
import { CityRateRow, type DeskRate } from "@/app/admin/(staff)/carriers/CityRateRow";

export type DeskCarrier = {
  id: string;
  name: string;
  scope: "DOMESTIC" | "INTERNATIONAL" | "BOTH";
  services: Array<{ id: string; label: string }>;
  rates: DeskRate[];
};

const SAVE = "rounded-md bg-[#ffcc00] px-3 py-2.5 text-sm font-semibold text-[#191919] disabled:opacity-60";
const SERVICES = [
  { value: "EXPRESS", label: "Express" },
  { value: "ECONOMY", label: "Standard" },
] as const;
const LANES = [
  { value: "DOMESTIC", label: "National" },
  { value: "INTERNATIONAL", label: "International" },
] as const;

export function RateCardEditor({ carriers }: { carriers: DeskCarrier[] }) {
  const [carrierId, setCarrierId] = useState(carriers[0]?.id ?? "");
  const carrier = carriers.find((item) => item.id === carrierId) ?? carriers[0];
  const [serviceClass, setServiceClass] = useState<string>("EXPRESS");
  const [lane, setLane] = useState<string>("INTERNATIONAL");
  const [placeName, setPlaceName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [baseAmount, setBaseAmount] = useState("");
  const [perKgAmount, setPerKgAmount] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  if (!carrier) return <p className="mt-8 text-sm text-[var(--muted)]">Add a carrier to set city rates.</p>;

  function chooseCarrier(nextId: string) {
    setCarrierId(nextId);
    setMessage("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await addCityRateAction({
      carrierId: carrier.id,
      serviceClass,
      lane,
      placeName,
      currency,
      baseAmount: Number(baseAmount),
      perKgAmount: Number(perKgAmount),
    });
    setPending(false);
    if ("error" in result) {
      setMessage(result.error);
      return;
    }
    setPlaceName("");
    setBaseAmount("");
    setPerKgAmount("");
    setMessage("City rate added.");
  }

  return (
    <section className="mt-8 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5">
      <label className="block max-w-md">
        <span className={LABEL}>Carrier</span>
        <select className={FIELD} value={carrier.id} onChange={(event) => chooseCarrier(event.target.value)}>
          {carriers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block"><span className={LABEL}>Service</span>
          <select className={FIELD} value={serviceClass} onChange={(event) => setServiceClass(event.target.value)}>
            {SERVICES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="block"><span className={LABEL}>Coverage</span>
          <select className={FIELD} value={lane} onChange={(event) => { setLane(event.target.value); setCurrency(event.target.value === "INTERNATIONAL" ? "USD" : "NPR"); }}>
            {LANES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="block"><span className={LABEL}>City</span>
          <input className={FIELD} required value={placeName} onChange={(event) => setPlaceName(event.target.value)} />
        </label>
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
        <button type="submit" disabled={pending} className={SAVE}>{pending ? "Adding…" : "Add city rate"}</button>
      </form>
      {message ? <p className="mt-3 text-xs text-[var(--muted)]">{message}</p> : null}
      <ul className="mt-6 space-y-3">
        {carrier.rates.length === 0 ? <li className="text-sm text-[var(--muted)]">No city rates for this carrier yet.</li> : null}
        {carrier.rates.map((rate) => <CityRateRow key={rate.id} rate={rate} />)}
      </ul>
    </section>
  );
}
