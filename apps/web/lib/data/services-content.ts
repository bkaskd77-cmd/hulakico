import { cache } from "react";
import { SERVICE_PAGES } from "@/lib/data/service-pages";
import { getHomepageContent } from "@/lib/data/homepage-content";
import { isAllowedImageUrl } from "@/lib/domain/homepage-rules";
import {
  SERVICE_LIMITS,
  slugifyTitle,
  type ServiceItem,
} from "@/lib/domain/service-catalogue";
import { getSql } from "@/lib/sql";

export type { ServiceItem } from "@/lib/domain/service-catalogue";
export { SERVICE_LIMITS, blankService } from "@/lib/domain/service-catalogue";

const SLUG = "services";
const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function stringList(value: unknown, fallback: string[], max: number): string[] {
  const raw = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : fallback;
  return raw.slice(0, max);
}

function asItem(page: (typeof SERVICE_PAGES)[number]): ServiceItem {
  return { ...page, tag: page.tag ?? "" };
}

function normalizeItem(raw: unknown, fallback: ServiceItem, used: Set<string>): ServiceItem {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const title = typeof row.title === "string" ? row.title : fallback.title;
  const slug = slugifyTitle(typeof row.slug === "string" ? row.slug : "") || slugifyTitle(title) || fallback.slug;
  let unique = slug;
  for (let n = 2; used.has(unique); n += 1) unique = `${slug}-${n}`;
  used.add(unique);
  const image = typeof row.image === "string" ? row.image : fallback.image;
  return {
    slug: unique,
    title,
    tag: typeof row.tag === "string" ? row.tag.slice(0, SERVICE_LIMITS.tag) : "",
    image: isAllowedImageUrl(image) ? image : fallback.image,
    summary: typeof row.summary === "string" ? row.summary : fallback.summary,
    intro: typeof row.intro === "string" ? row.intro : fallback.intro,
    highlights: stringList(row.highlights, fallback.highlights, SERVICE_LIMITS.highlights),
    needs: stringList(row.needs, fallback.needs, SERVICE_LIMITS.needs),
    howItWorks: stringList(row.howItWorks, fallback.howItWorks, SERVICE_LIMITS.howItWorks),
  };
}

/** Merges saved JSON with the built-in four services; bad slugs/images are repaired. */
export function normalizeServices(data: unknown, images?: Record<string, string>): ServiceItem[] {
  const seed = SERVICE_PAGES.map((page) => ({
    ...asItem(page),
    image: images?.[page.slug] || page.image,
  }));
  const raw = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
      ? (data as { items: unknown[] }).items
      : null;
  const used = new Set<string>();
  if (!raw) return seed.map((item) => normalizeItem(item, item, used));
  return raw.slice(0, SERVICE_LIMITS.items).map((row, i) => normalizeItem(row, seed[i] ?? seed[0], used));
}

export function validateServices(items: ServiceItem[]): string | null {
  if (items.length < 1) return "Keep at least one service.";
  if (items.length > SERVICE_LIMITS.items) return `Up to ${SERVICE_LIMITS.items} services.`;
  if (items.some((item) => !item.title.trim())) return "Every service needs a title.";
  if (items.some((item) => !SLUG_OK.test(item.slug))) {
    return "Each URL slug must be lowercase letters, numbers, and hyphens.";
  }
  if (items.some((item) => !isAllowedImageUrl(item.image))) return "Images must be uploaded through the editor.";
  return null;
}

async function seedFromHome(): Promise<ServiceItem[]> {
  try {
    const home = await getHomepageContent();
    return normalizeServices(null, home.serviceImages);
  } catch (error) {
    console.error("[services-content.ts:seedFromHome]", error instanceof Error ? error.message : error);
    return normalizeServices(null);
  }
}

async function loadServices(): Promise<ServiceItem[]> {
  try {
    const row = (await (await getSql())
      .prepare(`SELECT content_json FROM site_content WHERE slug = ?`)
      .get(SLUG)) as { content_json: string } | undefined;
    if (!row) return seedFromHome();
    return normalizeServices(JSON.parse(row.content_json));
  } catch (error) {
    console.error("[services-content.ts:loadServices]", error instanceof Error ? error.message : error);
    return seedFromHome();
  }
}

export async function saveServices(items: ServiceItem[]): Promise<{ ok: true } | { error: string }> {
  try {
    const content = normalizeServices(items);
    const problem = validateServices(content);
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
    console.error("[services-content.ts:saveServices]", error instanceof Error ? error.message : error);
    return { error: "Could not save services." };
  }
}

export const getServices = cache(loadServices);
