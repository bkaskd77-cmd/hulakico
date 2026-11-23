import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { checkPlace } from "@/lib/data/place-check";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

function regionName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Booking form: is this city in the chosen country? Map lookups cost money, so it is rate limited. */
export async function POST(request: Request) {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const limited = await enforceRateLimit("place-check", user.id, 60, 10 * 60_000);
    if ("retry" in limited) {
      return NextResponse.json({ verdict: "UNKNOWN", message: null });
    }

    const body = (await request.json()) as { city?: unknown; country?: unknown };
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 80) : "";
    const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "";
    if (city.length < 2 || !/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json({ verdict: "UNKNOWN", message: null });
    }

    const result = await checkPlace(city, country);
    if (result.verdict === "WRONG_COUNTRY") {
      const found = result.foundCountry || regionName(result.foundCountryCode);
      return NextResponse.json({
        verdict: result.verdict,
        message: `"${city}" is in ${found}, not ${regionName(country)}. Please check the city and country.`,
      });
    }
    if (result.verdict === "UNKNOWN") {
      return NextResponse.json({
        verdict: result.verdict,
        message: "We could not confirm this city on the map. Please check the spelling; you can still continue.",
      });
    }
    return NextResponse.json({ verdict: "OK", message: null });
  } catch (error) {
    console.error("[api/addresses/place-check/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ verdict: "UNKNOWN", message: null });
  }
}
