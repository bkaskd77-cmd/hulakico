/** Lowest amount in the lane currency when that currency exists, otherwise the lowest amount. */
export function lowestQuoteOption<T extends { amount: number; currency: string }>(
  options: T[],
  lane: "DOMESTIC" | "INTERNATIONAL",
): T | null {
  if (options.length === 0) return null;
  const preferred = lane === "INTERNATIONAL" ? "USD" : "NPR";
  const same = options.filter((option) => option.currency === preferred);
  const pool = same.length > 0 ? same : options;
  return pool.reduce((best, option) => (option.amount < best.amount ? option : best));
}

/** Rate-card key for "all other cities" in a country or lane: the fallback price. */
export const ANY_CITY = "*";

// Nepal local-body suffixes ("Kathmandu Metropolitan City" -> "kathmandu").
const NP_SUFFIX = /\s+(sub-?metropolitan city|metropolitan city|rural municipality|municipality|nagarpalika|gaunpalika)$/;

/** City key used to match an admin rate to the customer's city: case, spaces, and suffixes ignored. */
export function normalizePlaceName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(NP_SUFFIX, "").trim();
}

/** Cleaned postal-code list as stored: upper case tokens, a trailing * means "starts with". */
export function parsePostalCodes(raw: string): string[] {
  return [...new Set(raw.toUpperCase().split(/[\s,;]+/).map((t) => t.trim()).filter((t) => /^[A-Z0-9-]{2,10}\*?$/.test(t)))].slice(0, 50);
}

/** How specifically a postal code matches a rate's list: 0 none, longer = more specific. */
function postalScore(list: string | null | undefined, postalCode: string): number {
  const code = postalCode.trim().toUpperCase().replace(/\s+/g, "");
  if (!list || code.length < 2) return 0;
  let best = 0;
  for (const token of parsePostalCodes(list)) {
    if (token.endsWith("*")) {
      const prefix = token.slice(0, -1);
      if (code.startsWith(prefix)) best = Math.max(best, prefix.length);
    } else if (token === code) {
      best = Math.max(best, 100); // exact beats any prefix
    }
  }
  return best;
}

export type RateMatchTarget = { lane: "DOMESTIC" | "INTERNATIONAL"; country: string; city: string; postalCode: string };
type MatchableRate = { zoneLabel: string; lane: string | null; country?: string | null; postalCodes?: string | null };

/**
 * Picks the rate-card row for a destination, most specific first:
 * 1. postal code (exact, then longest prefix), 2. city name, 3. "all other cities" default.
 * Rows only count for the same lane and, when they name one, the same country.
 */
export function pickRate<T extends MatchableRate>(rates: T[], target: RateMatchTarget): T | null {
  const country = target.country.trim().toUpperCase();
  const pool = rates.filter((rate) => rate.lane === target.lane && (!rate.country || rate.country === country));
  let best: T | null = null;
  let bestScore = 0;
  for (const rate of pool) {
    const score = postalScore(rate.postalCodes, target.postalCode);
    if (score > bestScore) [best, bestScore] = [rate, score];
  }
  if (best) return best;
  const city = normalizePlaceName(target.city);
  if (city.length >= 2) {
    const byCity = pool.find((rate) => normalizePlaceName(rate.zoneLabel) === city);
    if (byCity) return byCity;
  }
  // Prefer a country-specific default over a lane-wide one.
  const defaults = pool.filter((rate) => rate.zoneLabel === ANY_CITY);
  return defaults.find((rate) => rate.country === country) ?? defaults[0] ?? null;
}

/** Older call sites: city only, no country or postal code. */
export function pickRateForCity<T extends MatchableRate>(rates: T[], lane: "DOMESTIC" | "INTERNATIONAL", destinationCity: string): T | null {
  return pickRate(rates, { lane, country: lane === "DOMESTIC" ? "NP" : "", city: destinationCity, postalCode: "" });
}

export type WeightSlab = { upToKg: number; amount: number };

const FIRST_SLAB_KG = 0.5;

/** Minimum covers the first 0.5 kg. Extra kg uses perKg, unless explicit slabs are passed. */
export function calculateQuoteAmount(
  baseAmount: number,
  perKgAmount: number,
  weightKg: number,
  slabs: WeightSlab[] = [],
): number {
  try {
    const rated = slabs.length > 0
      ? amountFromSlabs(slabs, perKgAmount, weightKg)
      : baseAmount + perKgAmount * Math.max(0, weightKg - FIRST_SLAB_KG);
    if (!Number.isFinite(rated)) {
      throw new Error("Quote amount was not a number.");
    }
    return Math.round(Math.max(baseAmount, rated) * 100) / 100;
  } catch (error) {
    console.error("[quoting.ts:calculateQuoteAmount]", error instanceof Error ? error.message : error);
    throw error instanceof Error ? error : new Error("Could not calculate the quote amount.");
  }
}

function amountFromSlabs(slabs: WeightSlab[], perKgAmount: number, weightKg: number): number {
  const sorted = slabs
    .filter((slab) => slab.upToKg > 0 && Number.isFinite(slab.amount))
    .sort((a, b) => a.upToKg - b.upToKg);
  if (sorted.length === 0) {
    throw new Error("Weight slabs were empty.");
  }
  const covered = sorted.find((slab) => weightKg <= slab.upToKg + 1e-9);
  if (covered) return covered.amount;
  const last = sorted[sorted.length - 1];
  return last.amount + perKgAmount * Math.max(0, weightKg - last.upToKg);
}

/** Higher of scale weight and volumetric weight, rounded up to the next 0.5 kg. */
export function billableKg(
  weightKg: number,
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  lane: "DOMESTIC" | "INTERNATIONAL",
): number {
  const divisor = lane === "INTERNATIONAL" ? 5000 : 6000;
  const volumetric = (lengthCm * widthCm * heightCm) / divisor;
  const raw = Math.max(weightKg, Number.isFinite(volumetric) ? volumetric : 0);
  const halfSteps = Math.ceil(raw * 2 - 1e-9);
  return Math.round((halfSteps / 2) * 100) / 100;
}

