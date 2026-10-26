import { readSiteContent, writeSiteContent } from "@/lib/data/site-content-store";
import { INTERNATIONAL_LANES } from "@/lib/domain/international-lanes";

const SLUG = "international-lanes";

/** Removes a country page that staff added; built-in countries stay. */
export async function removeLaneCopy(slug: string): Promise<{ ok: true } | { error: string }> {
  try {
    if (INTERNATIONAL_LANES.some((item) => item.slug === slug)) return { error: "Built-in country pages cannot be removed." };
    const row = (await readSiteContent(SLUG)) as { content_json: string } | undefined;
    if (!row) return { error: "Country page not found." };
    const saved = (JSON.parse(row.content_json) as { lanes?: Record<string, unknown> }).lanes ?? {};
    if (!saved[slug]) return { error: "Country page not found." };
    delete saved[slug];
    await writeSiteContent(SLUG, JSON.stringify({ lanes: saved }));
    return { ok: true };
  } catch (error) {
    console.error("[lane-remove.ts:removeLaneCopy]", error instanceof Error ? error.message : error);
    return { error: "Could not remove this country page." };
  }
}
