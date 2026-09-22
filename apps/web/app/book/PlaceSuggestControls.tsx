"use client";

import { useEffect, useRef, useState } from "react";
import type { PlaceSuggestion } from "@/lib/data/intelligence-client";

function sameCity(placeCity: string, hint: string): boolean {
  const a = placeCity.trim().toLowerCase();
  const b = hint.trim().toLowerCase();
  if (!a || !b) return true;
  return a === b || a.includes(b) || b.includes(a);
}

/** Country + city scoped place typeahead for booking addresses. */
export function PlaceSuggestControls({
  value,
  onChange,
  onBlur,
  field,
  lane,
  countryHint,
  cityHint,
  onPick,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  field: string;
  lane: string;
  countryHint: string;
  cityHint: string;
  onPick: (place: PlaceSuggestion) => void;
}) {
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setPlaces([]);
      setPending(false);
      return;
    }
    const ticket = ++seq.current;
    setPending(true);
    const timer = window.setTimeout(async () => {
      try {
        const country =
          lane === "DOMESTIC" ? "NP" : countryHint.trim().toUpperCase();
        const city = cityHint.trim();
        // Include city in the search text so live providers bias to that location.
        const query = city ? `${q}, ${city}` : q;
        const response = await fetch("/api/addresses/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            countryHint: country || undefined,
            cityHint: city || undefined,
          }),
        });
        const data = await response.json();
        if (ticket !== seq.current) return;
        let list = (data.places ?? []) as PlaceSuggestion[];
        if (country) {
          list = list.filter((place) => place.country === country);
        }
        if (city) {
          list = list.filter((place) => sameCity(place.city, city));
        }
        setPlaces(list);
        setOpen(list.length > 0);
      } catch (err) {
        console.error("[PlaceSuggestControls.tsx:debounce]", err);
        if (ticket === seq.current) setPlaces([]);
      } finally {
        if (ticket === seq.current) setPending(false);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [value, lane, countryHint, cityHint]);

  function choose(place: PlaceSuggestion) {
    onPick(place);
    setPlaces([]);
    setOpen(false);
  }

  return (
    <div className="relative sm:col-span-2">
      <label className="text-sm text-[var(--muted)]">
        Address line 1
        <input
          className={field}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
            onBlur();
          }}
          onFocus={() => places.length > 0 && setOpen(true)}
          required
          minLength={5}
          placeholder="Start typing a hotel, company, or street…"
          autoComplete="off"
        />
      </label>
      {pending ? (
        <p className="mt-1 text-xs text-[var(--muted)]">Looking up places…</p>
      ) : null}
      {open && places.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy)] shadow-lg">
          {places.map((place) => (
            <li key={`${place.label}-${place.line1}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-xs text-[var(--off-white)] hover:bg-[color-mix(in_srgb,var(--teal)_22%,transparent)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(place)}
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
    </div>
  );
}
