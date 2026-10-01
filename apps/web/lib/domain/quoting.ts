const VALLEY_CITIES = new Set([
  "kathmandu",
  "lalitpur",
  "bhaktapur",
  "kirtipur",
  "madhyapur thimi",
]);

const MAJOR_CITIES = new Set([
  "pokhara",
  "biratnagar",
  "birgunj",
  "butwal",
  "bharatpur",
  "chitwan",
  "dharan",
  "nepalgunj",
  "hetauda",
  "janakpur",
]);

export function resolveDomesticZone(destinationCity: string): string {
  const city = destinationCity.trim().toLowerCase();
  if (VALLEY_CITIES.has(city)) {
    return "valley";
  }
  if (MAJOR_CITIES.has(city)) {
    return "major_city";
  }
  return "nationwide";
}

const INTERNATIONAL_ZONES: Record<string, string> = {
  IN: "india",
  AE: "gulf",
  QA: "gulf",
  SA: "gulf",
  CN: "east_asia",
  JP: "east_asia",
  KR: "east_asia",
  SG: "east_asia",
  TH: "east_asia",
  MY: "east_asia",
  GB: "europe",
  DE: "europe",
  FR: "europe",
  NO: "europe",
  US: "americas",
  CA: "americas",
  AU: "oceania",
};

export function resolveInternationalZone(countryCode: string): string {
  return INTERNATIONAL_ZONES[countryCode.trim().toUpperCase()] ?? "world";
}

export function resolveZoneLabel(
  lane: "DOMESTIC" | "INTERNATIONAL",
  destinationCity: string,
  destinationCountry = "NP",
): string {
  if (lane === "INTERNATIONAL") {
    return resolveInternationalZone(destinationCountry);
  }
  return resolveDomesticZone(destinationCity);
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

export function pickRateForZone<T extends { zoneLabel: string }>(
  rates: T[],
  preferredZone: string,
): T | null {
  const exact = rates.find((rate) => rate.zoneLabel === preferredZone);
  if (exact) {
    return exact;
  }
  if (preferredZone === "major_city") {
    return rates.find((rate) => rate.zoneLabel === "nationwide") ?? rates[0] ?? null;
  }
  if (preferredZone === "valley") {
    return (
      rates.find((rate) => rate.zoneLabel === "major_city") ??
      rates.find((rate) => rate.zoneLabel === "nationwide") ??
      rates[0] ??
      null
    );
  }
  return rates.find((rate) => rate.zoneLabel === "world") ?? rates[0] ?? null;
}
