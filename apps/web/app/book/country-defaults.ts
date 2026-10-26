import type { FormState } from "./form-types";
import { detectFormLane } from "./validate-route";

/** Currency + COD rules derived from origin/destination countries. */
export function applyCountryDefaults(prev: FormState): FormState {
  const lane = detectFormLane(prev);
  if (lane === "DOMESTIC") {
    return {
      ...prev,
      currency: "NPR",
    };
  }
  return {
    ...prev,
    currency: "USD",
    wantsCod: false,
  };
}

export function currencyCue(lane: string): string {
  return lane === "DOMESTIC"
    ? "Prices within Nepal default to NPR. You can switch to USD if needed."
    : "International prices default to USD. Cash on delivery is not available abroad.";
}

export function codCue(lane: string): string {
  return lane === "DOMESTIC"
    ? "Cash on delivery is available for shipments within Nepal."
    : "Cash on delivery is not available for international shipments.";
}
