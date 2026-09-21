import type { SavedAddress } from "@/lib/data/addresses";
import type { PlaceSuggestion } from "@/lib/data/intelligence-client";
import {
  applyPlaceSuggestionToForm,
  applySavedAddressToForm,
} from "./apply-address";
import type { FormState } from "./form-types";

export function pickSavedForLane(
  prev: FormState,
  side: "origin" | "destination",
  address: SavedAddress,
  lane: string,
): FormState {
  const next = applySavedAddressToForm(prev, side, address);
  if (lane !== "DOMESTIC") return next;
  return { ...next, originCountry: "NP", destinationCountry: "NP" };
}

export function pickPlaceForLane(
  prev: FormState,
  side: "origin" | "destination",
  place: PlaceSuggestion,
  lane: string,
): FormState {
  const next = applyPlaceSuggestionToForm(prev, side, place);
  if (lane !== "DOMESTIC") return next;
  return { ...next, originCountry: "NP", destinationCountry: "NP" };
}
