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

export function resolveZoneLabel(
  lane: "DOMESTIC" | "INTERNATIONAL",
  destinationCity: string,
): string {
  if (lane === "INTERNATIONAL") {
    return "world";
  }
  return resolveDomesticZone(destinationCity);
}

export function calculateQuoteAmount(
  baseAmount: number,
  perKgAmount: number,
  weightKg: number,
): number {
  const amount = baseAmount + perKgAmount * weightKg;
  return Math.round(amount * 100) / 100;
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
  return rates[0] ?? null;
}
