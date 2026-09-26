import { cache } from "react";
import { getSql } from "@/lib/sql";
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
    const row = (await (await getSql())
      .prepare(`SELECT content_json FROM site_content WHERE slug = ?`)
      .get(SLUG)) as { content_json: string } | undefined;
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
    await (await getSql())
      .prepare(
        `INSERT INTO site_content (slug, content_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           content_json = excluded.content_json,
           updated_at = excluded.updated_at`,
      )
      .run(SLUG, JSON.stringify(content), new Date().toISOString());
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
