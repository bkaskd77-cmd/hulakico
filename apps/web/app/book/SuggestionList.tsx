"use client";

import type { SavedAddress } from "@/lib/data/addresses";
import type { PlaceSuggestion } from "@/lib/data/intelligence-client";

const ROW =
  "w-full px-3 py-2 text-left text-xs text-[var(--off-white)] hover:bg-[color-mix(in_srgb,var(--teal)_22%,transparent)]";

/** Dropdown under an address field: saved addresses first, then live places, then attribution. */
export function SuggestionList({
  saved,
  places,
  attribution,
  onPickSaved,
  onPickPlace,
}: {
  saved: SavedAddress[];
  places: PlaceSuggestion[];
  attribution: string | null;
  onPickSaved: (address: SavedAddress) => void;
  onPickPlace: (place: PlaceSuggestion) => void;
}) {
  // Keep focus in the input while clicking a row, so blur does not close the list first.
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();
  return (
    <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy)] shadow-lg">
      {saved.map((address) => (
        <li key={`saved-${address.id}`}>
          <button type="button" className={ROW} onMouseDown={keepFocus} onClick={() => onPickSaved(address)}>
            <span className="mr-1.5 rounded bg-[color-mix(in_srgb,var(--teal)_30%,transparent)] px-1.5 py-0.5 text-[10px] font-semibold uppercase">Saved</span>
            <span className="font-semibold">{address.label}</span>
            <span className="mt-0.5 block text-[var(--muted)]">{address.contactName} · {address.line1}, {address.city}</span>
          </button>
        </li>
      ))}
      {places.map((place) => (
        <li key={`${place.label}-${place.line1}`}>
          <button type="button" className={ROW} onMouseDown={keepFocus} onClick={() => onPickPlace(place)}>
            <span className="font-semibold">{place.label}</span>
            <span className="mt-0.5 block text-[var(--muted)]">
              {place.line1}
              {place.postalCode ? `, ${place.postalCode}` : ""} · {place.city}, {place.country}
            </span>
          </button>
        </li>
      ))}
      {attribution === "geoapify" && places.length > 0 ? (
        <li className="border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-3 py-1.5 text-right text-[10px] text-[var(--muted)]">
          Powered by{" "}
          <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--off-white)]" onMouseDown={keepFocus}>
            Geoapify
          </a>
        </li>
      ) : null}
    </ul>
  );
}
