import type { SavedAddress } from "@/lib/data/addresses";
import type { PlaceSuggestion } from "@/lib/data/intelligence-client";
import { PARTY_KEYS } from "./party-keys";
import type { FormState } from "./form-types";

export function applySavedAddressToForm(
  prev: FormState,
  side: keyof typeof PARTY_KEYS,
  address: SavedAddress,
): FormState {
  const k = PARTY_KEYS[side];
  return {
    ...prev,
    [k.contactName]: address.contactName,
    [k.company]: address.company ?? "",
    [k.phone]: address.phone ?? "",
    [k.email]: address.email ?? "",
    [k.country]: address.country,
    [k.city]: address.city,
    [k.postal]: address.postalCode ?? "",
    [k.line1]: address.line1,
    [k.line2]: address.line2 ?? "",
  };
}

export function applyPlaceSuggestionToForm(
  prev: FormState,
  side: keyof typeof PARTY_KEYS,
  place: PlaceSuggestion,
): FormState {
  const k = PARTY_KEYS[side];
  const existingCompany = prev[k.company].trim();
  const isBusiness = place.kind === "BUSINESS";
  const suggestedCompany = isBusiness ? (place.company ?? "").trim() : "";
  return {
    ...prev,
    // ADDRESS kind never touches company; BUSINESS only fills when empty.
    [k.company]: existingCompany || suggestedCompany || prev[k.company],
    [k.country]: place.country,
    [k.city]: place.city,
    [k.postal]: place.postalCode ?? "",
    [k.line1]: place.line1,
    [k.line2]: place.line2 ?? "",
  };
}

export function formSideToSavedInput(
  form: FormState,
  side: keyof typeof PARTY_KEYS,
  label: string,
) {
  const k = PARTY_KEYS[side];
  return {
    label,
    contactName: form[k.contactName],
    company: form[k.company] || undefined,
    phone: form[k.phone] || undefined,
    email: form[k.email] || undefined,
    country: form[k.country],
    city: form[k.city],
    postalCode: form[k.postal] || undefined,
    line1: form[k.line1],
    line2: form[k.line2] || undefined,
  };
}
