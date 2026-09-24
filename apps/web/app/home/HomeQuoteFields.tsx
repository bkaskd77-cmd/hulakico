"use client";

import { useState } from "react";
import { BOOKING_COUNTRIES } from "@/app/book/countries";
import { PlaceSuggestControls } from "@/app/book/PlaceSuggestControls";
import type { PlaceSuggestion } from "@/lib/data/intelligence-client";

export const QUOTE_FIELD =
  "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-sm text-[var(--off-white)] outline-none focus:border-[var(--teal)]";

export type QuoteRouteSide = {
  country: string;
  line1: string;
  city: string;
  postalCode: string;
};

export type QuoteSpecPayload = {
  origin: QuoteRouteSide;
  destination: QuoteRouteSide;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  serviceClass: string;
  packageType: string;
  contents: string;
};

const EMPTY: QuoteRouteSide = { country: "NP", line1: "", city: "", postalCode: "" };

function applyPlace(side: QuoteRouteSide, place: PlaceSuggestion): QuoteRouteSide {
  return {
    country: place.country || side.country,
    line1: place.line1,
    city: place.city,
    postalCode: place.postalCode ?? side.postalCode,
  };
}

function SideFields({
  label,
  side,
  setSide,
}: {
  label: string;
  side: QuoteRouteSide;
  setSide: (next: QuoteRouteSide) => void;
}) {
  const lane = side.country === "NP" ? "DOMESTIC" : "INTERNATIONAL";
  return (
    <div className="space-y-3">
      <p className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--off-white)]">{label}</p>
      <PlaceSuggestControls
        value={side.line1}
        onChange={(line1) => setSide({ ...side, line1 })}
        onBlur={() => undefined}
        field={QUOTE_FIELD}
        lane={lane}
        countryHint={side.country}
        cityHint={side.city}
        onPick={(place) => setSide(applyPlace(side, place))}
      />
      <label className="block text-xs text-[var(--muted)]">City
        <input required value={side.city} onChange={(e) => setSide({ ...side, city: e.target.value })} className={QUOTE_FIELD} /></label>
      <label className="block text-xs text-[var(--muted)]">Postal code
        <input value={side.postalCode} onChange={(e) => setSide({ ...side, postalCode: e.target.value })} className={QUOTE_FIELD} /></label>
    </div>
  );
}

export function HomeQuoteFields({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (payload: QuoteSpecPayload) => void;
}) {
  const [origin, setOrigin] = useState<QuoteRouteSide>(EMPTY);
  const [destination, setDestination] = useState<QuoteRouteSide>({ ...EMPTY, country: "NP" });

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          origin,
          destination,
          weightKg: Number(form.get("weightKg")),
          lengthCm: Number(form.get("lengthCm")),
          widthCm: Number(form.get("widthCm")),
          heightCm: Number(form.get("heightCm")),
          serviceClass: String(form.get("serviceClass") ?? "EXPRESS"),
          packageType: String(form.get("packageType") ?? "PARCEL"),
          contents: String(form.get("contents") ?? ""),
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-[var(--muted)]">From country
          <select required value={origin.country} onChange={(e) => setOrigin({ ...origin, country: e.target.value })} className={QUOTE_FIELD}>
            {BOOKING_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select></label>
        <label className="text-xs text-[var(--muted)]">To country
          <select required value={destination.country} onChange={(e) => setDestination({ ...destination, country: e.target.value })} className={QUOTE_FIELD}>
            {BOOKING_COUNTRIES.map((c) => <option key={`d-${c.code}`} value={c.code}>{c.name}</option>)}
          </select></label>
      </div>
      <div className="grid gap-8 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-6 sm:grid-cols-2">
        <SideFields label="From" side={origin} setSide={setOrigin} />
        <SideFields label="To" side={destination} setSide={setDestination} />
      </div>
      <div className="grid gap-4 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-6 sm:grid-cols-4">
        <label className="text-xs text-[var(--muted)]">Weight (kg)
          <input name="weightKg" type="number" min="0.1" step="0.1" required defaultValue="1" className={QUOTE_FIELD} /></label>
        <label className="text-xs text-[var(--muted)]">Length (cm)
          <input name="lengthCm" type="number" min="1" step="1" required defaultValue="30" className={QUOTE_FIELD} /></label>
        <label className="text-xs text-[var(--muted)]">Width (cm)
          <input name="widthCm" type="number" min="1" step="1" required defaultValue="20" className={QUOTE_FIELD} /></label>
        <label className="text-xs text-[var(--muted)]">Height (cm)
          <input name="heightCm" type="number" min="1" step="1" required defaultValue="15" className={QUOTE_FIELD} /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-[var(--muted)]">Service
          <select name="serviceClass" defaultValue="EXPRESS" className={QUOTE_FIELD}>
            <option value="EXPRESS">Express</option>
            <option value="STANDARD">Standard</option>
          </select></label>
        <label className="text-xs text-[var(--muted)]">Package
          <select name="packageType" defaultValue="PARCEL" className={QUOTE_FIELD}>
            <option value="PARCEL">Parcel</option>
            <option value="DOCUMENT">Document</option>
          </select></label>
        <label className="text-xs text-[var(--muted)] sm:col-span-2">Specs / contents
          <input name="contents" placeholder="e.g. clothing, electronics" className={QUOTE_FIELD} /></label>
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-[var(--gold)] px-7 py-3.5 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
        {pending ? "Ranking carriers…" : "Get the Quote"}
      </button>
    </form>
  );
}
