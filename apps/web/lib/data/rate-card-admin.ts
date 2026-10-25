import { checkRatePlace } from "@/lib/data/rate-cards";
import { ANY_CITY } from "@/lib/domain/quoting";
import { getSql } from "@/lib/sql";

/**
 * Why a saved rate can never be used, or null when it is fine. Catches older rows saved
 * before the country rules, such as a Nepal city entered as an International rate.
 */
export function rateProblem(rate: { lane: string | null; placeName: string | null; zoneLabel: string; country: string | null }): string | null {
  if (rate.lane === "INTERNATIONAL" && !rate.country) {
    return "No destination country. Remove it and add it again with a country.";
  }
  const check = checkRatePlace({
    lane: rate.lane ?? "",
    placeName: rate.placeName ?? "",
    country: rate.country ?? "",
    postalCodes: "",
    allOtherCities: rate.zoneLabel === ANY_CITY,
  });
  return "error" in check ? check.error : null;
}

export async function deleteRateCard(id: string): Promise<{ ok: true } | { error: string }> {
  try {
    const rateId = id.trim();
    if (!/^rate_[a-f0-9]{24}$/.test(rateId)) return { error: "Unknown rate card." };
    const result = await (await getSql()).prepare(`DELETE FROM rate_cards WHERE id = ?`).run(rateId);
    if (!result.changes) return { error: "Rate card not found." };
    return { ok: true };
  } catch (error) {
    console.error("[rate-card-admin.ts:deleteRateCard]", error instanceof Error ? error.message : error);
    return { error: "Could not remove the rate card." };
  }
}
