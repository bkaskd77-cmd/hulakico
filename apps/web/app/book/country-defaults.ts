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
    ? "Default NPR for Nepal domestic. You can switch to USD if needed."
    : "Default USD for international. COD is not available on this lane.";
}

export function codCue(lane: string): string {
  return lane === "DOMESTIC"
    ? "COD is available when both ends are Nepal."
    : "COD is Nepal-domestic only — disabled for international.";
}
