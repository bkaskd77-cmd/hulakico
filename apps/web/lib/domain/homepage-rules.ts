import {
  DEFAULT_FEATURE_IMAGES,
  DEFAULT_HOMEPAGE,
} from "@/lib/domain/homepage-defaults";
import {
  HOME_LIMITS,
  HOME_SECTION_KEYS,
  type HomeFeature,
  type HomepageContent,
  type HomeSectionKey,
  type HeroStep,
} from "@/lib/domain/homepage-types";

const SITE_IMAGE = /^\/home\/[\w.-]+\.(jpe?g|png|webp|avif)$/i;
const BLOB_IMAGE = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[\w./-]+$/i;

export function isAllowedImageUrl(url: string): boolean {
  return SITE_IMAGE.test(url) || BLOB_IMAGE.test(url);
}

const text = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback);
const strings = (value: unknown, fallback: string[]) =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [...fallback];

function sectionKeys(value: unknown): HomeSectionKey[] {
  if (!Array.isArray(value)) return [];
  const valid = value.filter((v): v is HomeSectionKey => HOME_SECTION_KEYS.includes(v as HomeSectionKey));
  return [...new Set(valid)];
}

function features(value: unknown): HomeFeature[] {
  if (!Array.isArray(value)) return DEFAULT_HOMEPAGE.features.map((f) => ({ ...f }));
  return value.map((item, index) => ({
    title: text(item?.title, ""),
    body: text(item?.body, ""),
    image: text(item?.image, "") || DEFAULT_FEATURE_IMAGES[index % DEFAULT_FEATURE_IMAGES.length],
  }));
}

function steps(value: unknown): HeroStep[] {
  if (!Array.isArray(value)) return DEFAULT_HOMEPAGE.heroTimeline.map((s) => ({ ...s }));
  return value.map((item) => ({ label: text(item?.label, ""), done: item?.done === true }));
}

/** Merges saved JSON (any older shape) with defaults; unknown/obsolete keys are dropped. */
export function normalizeHomepage(data: Record<string, unknown> | null): HomepageContent {
  const d = data ?? {};
  const base = DEFAULT_HOMEPAGE;
  const order = sectionKeys(d.sectionOrder);
  const out = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(base) as Array<keyof HomepageContent>) {
    if (typeof base[key] === "string") out[key] = text(d[key], base[key] as string);
  }
  return {
    ...(out as HomepageContent),
    sectionOrder: [...order, ...HOME_SECTION_KEYS.filter((key) => !order.includes(key))],
    hiddenSections: sectionKeys(d.hiddenSections),
    showHeroTimeline: typeof d.showHeroTimeline === "boolean" ? d.showHeroTimeline : base.showHeroTimeline,
    heroTimeline: steps(d.heroTimeline),
    towerAlerts: strings(d.towerAlerts, base.towerAlerts),
    features: features(d.features),
    openingHours: strings(d.openingHours, base.openingHours),
    socialLinks: { ...base.socialLinks, ...((d.socialLinks as object) ?? {}) },
  };
}

/** Returns a human-readable problem, or null when the content can be published. */
export function validateHomepage(content: HomepageContent): string | null {
  if (!content.heroHeadline.trim() || !content.heroSubhead.trim()) {
    return "Hero headline and supporting line are required.";
  }
  if (content.features.length > HOME_LIMITS.features) return `Up to ${HOME_LIMITS.features} features.`;
  if (content.towerAlerts.length > HOME_LIMITS.towerAlerts) return `Up to ${HOME_LIMITS.towerAlerts} highlights.`;
  if (content.heroTimeline.length > HOME_LIMITS.heroTimeline) return `Up to ${HOME_LIMITS.heroTimeline} timeline steps.`;
  if (content.openingHours.length > HOME_LIMITS.openingHours) return `Up to ${HOME_LIMITS.openingHours} opening-hour lines.`;
  if (content.features.some((f) => !f.title.trim())) return "Every feature needs a title.";
  const images = [content.heroImage, ...content.features.map((f) => f.image)];
  if (images.some((url) => !isAllowedImageUrl(url))) return "Images must be uploaded through the editor.";
  const badLink = Object.values(content.socialLinks).find(
    (url) => url.trim() !== "" && !/^https:\/\/[^\s]+$/i.test(url.trim()),
  );
  if (badLink) return "Social links must be full https:// addresses.";
  return null;
}
