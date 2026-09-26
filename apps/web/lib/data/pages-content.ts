import { cache } from "react";
import { INFO_PAGES, type InfoSection } from "@/lib/data/info-pages";
import {
  PAGE_GROUPS,
  PAGE_LIMITS,
  cleanSlug,
  isReservedSlug,
  type SitePage,
} from "@/lib/domain/page-catalogue";
import { getSql } from "@/lib/sql";

export type { SitePage } from "@/lib/domain/page-catalogue";

const SLUG = "pages";
const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function sections(value: unknown, fallback: InfoSection[]): InfoSection[] {
  if (!Array.isArray(value)) return fallback.map((section) => ({ ...section, body: [...section.body] }));
  return value.slice(0, PAGE_LIMITS.sections).map((section, index) => {
    const row = section && typeof section === "object" ? (section as Record<string, unknown>) : {};
    const base = fallback[index] ?? { heading: "", body: [] };
    const body = Array.isArray(row.body)
      ? row.body.filter((line): line is string => typeof line === "string").slice(0, PAGE_LIMITS.paragraphs)
      : [...base.body];
    return { heading: text(row.heading, base.heading), body };
  });
}

function asPage(page: (typeof INFO_PAGES)[number]): SitePage {
  return { ...page, updated: page.updated ?? "", standalone: page.standalone === true, sections: page.sections.map((s) => ({ ...s, body: [...s.body] })) };
}

function normalizeItem(raw: unknown, fallback: SitePage, used: Set<string>): SitePage {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const title = text(row.title, fallback.title);
  const slug = cleanSlug(text(row.slug, ""), title) || fallback.slug;
  let unique = slug;
  for (let n = 2; used.has(unique); n += 1) unique = `${slug}-${n}`;
  used.add(unique);
  const group = PAGE_GROUPS.includes(row.group as SitePage["group"]) ? (row.group as SitePage["group"]) : fallback.group;
  return {
    slug: unique,
    title,
    group,
    intro: text(row.intro, fallback.intro),
    updated: text(row.updated, fallback.updated),
    standalone: row.standalone === true,
    sections: sections(row.sections, fallback.sections),
  };
}

/** Merges saved JSON with About, Help, Terms, Privacy, and Contact. */
export function normalizePages(data: unknown): SitePage[] {
  const seed = INFO_PAGES.map(asPage);
  const raw = data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
    ? (data as { items: unknown[] }).items
    : null;
  const used = new Set<string>();
  const empty = asPage({ slug: "page", group: "Company", title: "", intro: "", sections: [] });
  if (!raw) return seed.map((item) => normalizeItem(item, item, used));
  return raw.slice(0, PAGE_LIMITS.items).map((row, index) => normalizeItem(row, seed[index] ?? empty, used));
}

export function validatePages(items: SitePage[]): string | null {
  if (items.length < 1) return "Keep at least one page.";
  if (items.some((item) => !item.title.trim())) return "Every page needs a title.";
  if (items.some((item) => !SLUG_OK.test(item.slug))) return "Each URL slug must be lowercase letters, numbers, and hyphens.";
  if (items.some((item) => isReservedSlug(item.slug, item.standalone))) return "That web address is already used by another part of the site.";
  if (items.some((item) => item.sections.some((section) => !section.heading.trim()))) return "Every section needs a heading.";
  return null;
}

async function loadPages(): Promise<SitePage[]> {
  try {
    const row = (await (await getSql())
      .prepare(`SELECT content_json FROM site_content WHERE slug = ?`)
      .get(SLUG)) as { content_json: string } | undefined;
    if (!row) return normalizePages(null);
    return normalizePages(JSON.parse(row.content_json));
  } catch (error) {
    console.error("[pages-content.ts:loadPages]", error instanceof Error ? error.message : error);
    return normalizePages(null);
  }
}

export async function savePages(items: SitePage[]): Promise<{ ok: true } | { error: string }> {
  try {
    const content = normalizePages(items);
    const problem = validatePages(content);
    if (problem) return { error: problem };
    await (await getSql())
      .prepare(
        `INSERT INTO site_content (slug, content_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           content_json = excluded.content_json,
           updated_at = excluded.updated_at`,
      )
      .run(SLUG, JSON.stringify({ items: content }), new Date().toISOString());
    return { ok: true };
  } catch (error) {
    console.error("[pages-content.ts:savePages]", error instanceof Error ? error.message : error);
    return { error: "Could not save pages." };
  }
}

export const getPages = cache(loadPages);
