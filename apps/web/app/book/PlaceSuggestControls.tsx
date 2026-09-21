"use client";

import { useState } from "react";
import type { PlaceSuggestion } from "@/lib/data/intelligence-client";
import { PARTY_KEYS } from "./party-keys";
import type { FormState } from "./form-types";

export function PlaceSuggestControls({
  side,
  form,
  field,
  lane,
  onPick,
}: {
  side: keyof typeof PARTY_KEYS;
  form: FormState;
  field: string;
  lane: string;
  onPick: (place: PlaceSuggestion) => void;
}) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [pending, setPending] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  async function search() {
    const q = query.trim();
    if (q.length < 2) {
      setHint("Type at least 2 characters.");
      return;
    }
    setHint(null);
    setPending(true);
    try {
      const countryHint =
        lane === "DOMESTIC" ? "NP" : form[PARTY_KEYS[side].country];
      const response = await fetch("/api/addresses/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, countryHint }),
      });
      const data = await response.json();
      let list = (data.places ?? []) as PlaceSuggestion[];
      if (lane === "DOMESTIC") {
        list = list.filter((place) => place.country === "NP");
      }
      setPlaces(list);
      setHint(
        list.length === 0
          ? lane === "DOMESTIC"
            ? "No Nepal matches in the stub catalog yet."
            : "No online matches yet (stub catalog). Real Places/AI comes in Phase 4."
          : "Click a suggestion to fill city, postal, and address lines.",
      );
    } catch (err) {
      console.error("[PlaceSuggestControls.tsx:search]", err);
      setHint("Search failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-3 space-y-2">
      <label className="block text-sm text-[var(--muted)]">
        Search place / hotel / company (online)
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            className={`${field} mt-0 flex-1`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Yak & Yeti, Lakeside, Clarion Oslo"
          />
          <button
            type="button"
            onClick={search}
            disabled={pending}
            className="rounded-md bg-[var(--teal)] px-3 py-2 text-xs font-semibold text-[var(--off-white)] disabled:opacity-60"
          >
            {pending ? "Searching…" : "Search"}
          </button>
        </div>
      </label>
      {places.length > 0 ? (
        <ul className="space-y-1">
          {places.map((place) => (
            <li key={`${place.label}-${place.city}`}>
              <button
                type="button"
                onClick={() => onPick(place)}
                className="w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy)] px-3 py-2 text-left text-xs text-[var(--off-white)] hover:border-[var(--gold)]"
              >
                <span className="font-semibold">{place.label}</span>
                <span className="mt-0.5 block text-[var(--muted)]">
                  {place.line1}
                  {place.postalCode ? `, ${place.postalCode}` : ""} · {place.city},{" "}
                  {place.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
