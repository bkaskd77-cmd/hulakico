"use client";

import { useEffect, useRef, useState } from "react";
import type { SavedAddress } from "@/lib/data/addresses";
import type { PlaceSuggestion } from "@/lib/data/intelligence-client";
import { matchSavedAddresses } from "./saved-match";
import { SuggestionList } from "./SuggestionList";

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
  saved = [],
  onPickSaved,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  field: string;
  lane: string;
  countryHint: string;
  cityHint: string;
  onPick: (place: PlaceSuggestion) => void;
  /** The customer's own saved addresses for this side; matches are shown first. */
  saved?: SavedAddress[];
  onPickSaved?: (address: SavedAddress) => void;
}) {
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [attribution, setAttribution] = useState<string | null>(null);
  const seq = useRef(0);
  // Short input shows nothing; old results stay hidden instead of being reset in the effect.
  const active = value.trim().length >= 2;
  const savedHits = active && onPickSaved ? matchSavedAddresses(value, saved) : [];
  const hasRows = savedHits.length > 0 || places.length > 0;

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) return;
    const ticket = ++seq.current;
    const timer = window.setTimeout(async () => {
      setPending(true);
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
        setAttribution(data.attribution === "geoapify" ? "geoapify" : null);
        // Only open here: closing would also hide matching saved addresses. Blur and picks close it.
        if (list.length > 0) setOpen(true);
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
          onFocus={() => active && hasRows && setOpen(true)}
          required
          minLength={5}
          placeholder="Start typing a hotel, company, or street…"
          autoComplete="off"
        />
      </label>
      {active && pending ? (
        <p className="mt-1 text-xs text-[var(--muted)]">Looking up places…</p>
      ) : null}
      {open && active && hasRows ? (
        <SuggestionList
          saved={savedHits}
          places={places}
          attribution={attribution}
          onPickSaved={(address) => { onPickSaved?.(address); setOpen(false); }}
          onPickPlace={choose}
        />
      ) : null}
    </div>
  );
}
