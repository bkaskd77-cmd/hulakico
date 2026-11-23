/** City-in-country check against the intelligence service; never blocks when the service is down. */
export type PlaceVerdict =
  | { verdict: "OK" | "UNKNOWN" }
  | { verdict: "WRONG_COUNTRY"; foundCountryCode: string; foundCountry: string };

const FETCH_MS = 5000; // the service waits up to 4 s on the geocoder
const CIRCUIT_MS = 30_000;
let circuitOpenUntil = 0;

/** Asks the intelligence service whether `city` is in `country` (ISO 2-letter code). */
export async function checkPlace(city: string, country: string): Promise<PlaceVerdict> {
  const baseUrl = process.env.INTELLIGENCE_API_URL;
  const token = process.env.INTELLIGENCE_SERVICE_TOKEN;
  if (!baseUrl || !token || Date.now() < circuitOpenUntil) return { verdict: "UNKNOWN" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_MS);
  try {
    const response = await fetch(`${baseUrl}/v1/place-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ city: city.trim().slice(0, 120), country: country.trim().toUpperCase() }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`place-check failed: ${response.status}`);
    const data = (await response.json()) as PlaceVerdict;
    return data.verdict === "WRONG_COUNTRY" || data.verdict === "OK" ? data : { verdict: "UNKNOWN" };
  } catch (error) {
    circuitOpenUntil = Date.now() + CIRCUIT_MS;
    console.warn("[place-check.ts:checkPlace] offline fallback", error instanceof Error ? error.message : error);
    return { verdict: "UNKNOWN" };
  } finally {
    clearTimeout(timeout);
  }
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** A customer-facing message when a city clearly belongs to another country; null otherwise. */
export async function wrongCountryMessage(
  side: "sender" | "receiver",
  city: string,
  country: string,
): Promise<string | null> {
  const result = await checkPlace(city, country);
  if (result.verdict !== "WRONG_COUNTRY") return null;
  const found = result.foundCountry || countryName(result.foundCountryCode);
  return `The ${side}'s city "${city.trim()}" is in ${found}, not ${countryName(country)}. Please check the city and country.`;
}
