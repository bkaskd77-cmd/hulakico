import { readSiteContent, writeSiteContent } from "@/lib/data/site-content-store";
import { cache } from "react";
import { normalizeHomepage, validateHomepage } from "@/lib/domain/homepage-rules";
import type { HomepageContent } from "@/lib/domain/homepage-types";

export type { HomepageContent, HomeFeature, HeroStep, HomeSectionKey } from "@/lib/domain/homepage-types";
export { DEFAULT_HOMEPAGE } from "@/lib/domain/homepage-defaults";

const SLUG = "homepage";

function parseSaved(raw: string): HomepageContent {
  try {
    return normalizeHomepage(JSON.parse(raw) as Record<string, unknown>);
  } catch (error) {
    console.error(
      "[homepage-content.ts:parseSaved] Saved homepage JSON is invalid; using defaults.",
      error instanceof Error ? error.message : error,
    );
    return normalizeHomepage(null);
  }
}

/** Public homepage content — saved override merged with built-in defaults. */
async function loadHomepageContent(): Promise<HomepageContent> {
  try {
    const row = (await readSiteContent(SLUG)) as { content_json: string } | undefined;
    return row ? parseSaved(row.content_json) : normalizeHomepage(null);
  } catch (error) {
    console.error(
      "[homepage-content.ts:getHomepageContent]",
      error instanceof Error ? error.message : error,
    );
    return normalizeHomepage(null);
  }
}

/** Staff save — validates, normalises, then replaces the homepage JSON. */
export async function saveHomepageContent(
  input: HomepageContent,
): Promise<{ ok: true } | { error: string }> {
  try {
    const content = normalizeHomepage(input as unknown as Record<string, unknown>);
    const problem = validateHomepage(content);
    if (problem) return { error: problem };
    await writeSiteContent(SLUG, JSON.stringify(content));
    return { ok: true };
  } catch (error) {
    console.error(
      "[homepage-content.ts:saveHomepageContent]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not save homepage content." };
  }
}

export const getHomepageContent = cache(loadHomepageContent);
