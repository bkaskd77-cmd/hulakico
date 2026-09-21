"use client";

import type { FormState, FormUpdate } from "./form-types";

const NP_CITIES = [
  "Kathmandu",
  "Pokhara",
  "Biratnagar",
  "Birgunj",
  "Dharan",
  "Butwal",
];

function CityHints({ onPick }: { onPick: (city: string) => void }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {NP_CITIES.map((city) => (
        <button
          key={city}
          type="button"
          onClick={() => onPick(city)}
          className="rounded border border-[color-mix(in_srgb,var(--teal)_45%,transparent)] px-2 py-0.5 text-[10px] text-[var(--teal)]"
        >
          {city}
        </button>
      ))}
    </div>
  );
}

export function RouteFields({
  form,
  update,
  field,
  lane,
}: {
  form: FormState;
  update: FormUpdate;
  field: string;
  lane: string;
}) {
  return (
    <div className="mt-6 space-y-6">
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--gold)]">
          From
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-[var(--muted)]">
            Country (ISO)
            <input
              className={field}
              value={form.originCountry}
              onChange={(e) => update("originCountry", e.target.value)}
              required
              maxLength={2}
            />
          </label>
          <label className="text-sm text-[var(--muted)]">
            City
            <input
              className={field}
              value={form.originCity}
              onChange={(e) => update("originCity", e.target.value)}
              required
            />
            {lane === "DOMESTIC" ? (
              <CityHints onPick={(city) => update("originCity", city)} />
            ) : null}
          </label>
          <label className="sm:col-span-2 text-sm text-[var(--muted)]">
            Full address
            <input
              className={field}
              value={form.originAddress}
              onChange={(e) => update("originAddress", e.target.value)}
              required
              placeholder="Street, tole, landmark"
            />
          </label>
        </div>
      </section>
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--gold)]">
          To
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-[var(--muted)]">
            Country (ISO)
            <input
              className={field}
              value={form.destinationCountry}
              onChange={(e) => update("destinationCountry", e.target.value)}
              required
              maxLength={2}
            />
          </label>
          <label className="text-sm text-[var(--muted)]">
            City
            <input
              className={field}
              value={form.destinationCity}
              onChange={(e) => update("destinationCity", e.target.value)}
              required
            />
            {lane === "DOMESTIC" ? (
              <CityHints onPick={(city) => update("destinationCity", city)} />
            ) : null}
          </label>
          <label className="sm:col-span-2 text-sm text-[var(--muted)]">
            Full address
            <input
              className={field}
              value={form.destinationAddress}
              onChange={(e) => update("destinationAddress", e.target.value)}
              required
              placeholder="Street, tole, landmark"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
