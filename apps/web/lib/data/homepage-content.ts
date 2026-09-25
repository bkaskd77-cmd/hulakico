import { getDb } from "@/lib/db";

export type HomeFeature = { title: string; body: string };
export type HomeService = { name: string; detail: string };

/** Editable homepage fields (public /). */
export type HomepageContent = {
  heroHeadline: string;
  heroSubhead: string;
  ctaBook: string;
  ctaQuote: string;
  hubTrackLabel: string;
  hubBookLabel: string;
  hubQuoteLabel: string;
  hubTrackPlaceholder: string;
  towerAlerts: string[];
  featuresEyebrow: string;
  featuresTitle: string;
  featuresIntro: string;
  features: HomeFeature[];
  servicesEyebrow: string;
  servicesTitle: string;
  services: HomeService[];
  servicesCta: string;
  footerTagline: string;
};

export const DEFAULT_HOMEPAGE: HomepageContent = {
  heroHeadline: "AI logistics control tower for Nepal — and beyond.",
  heroSubhead:
    "Book once. We orchestrate every carrier and keep one intelligent timeline from Kathmandu to the world.",
  ctaBook: "Book a shipment",
  ctaQuote: "Get the Quote",
  hubTrackLabel: "Track",
  hubBookLabel: "Book",
  hubQuoteLabel: "Quote",
  hubTrackPlaceholder: "Hulakico AWB or tracking code",
  towerAlerts: [
    "One Hulakico AWB spans every partner lane — domestic Nepal and international.",
    "AI ranks carriers on price, ETA risk, and service fit before you book.",
  ],
  featuresEyebrow: "Platform",
  featuresTitle: "Built like a control tower, not a form.",
  featuresIntro:
    "Hulakico is the middleman layer — AI ranks partners, humans stay in the loop, customers see one story.",
  features: [
    {
      title: "One booking brain",
      body: "Domestic Nepal or international — a single draft becomes ranked carrier options and a confirmed AWB.",
    },
    {
      title: "AI lane intelligence",
      body: "ETA risk, document QC, and carrier scoring run behind the book so ops and customers share one truth.",
    },
    {
      title: "Live exception loop",
      body: "Holds, missing docs, and COD settle stay on the same timeline — reply from track, resolve from the tower.",
    },
  ],
  servicesEyebrow: "Services",
  servicesTitle: "What we run for every shipment.",
  services: [
    {
      name: "Nepal domestic",
      detail:
        "Valley, Terai, and hill lanes with COD when cash must travel with the parcel.",
    },
    {
      name: "International",
      detail:
        "Cross-border and air partners with commercial invoice tooling and QC gates.",
    },
    {
      name: "Live tracking",
      detail: "One public link for shipper and consignee — status updates in one place.",
    },
    {
      name: "Settle & notify",
      detail:
        "Payments, COD ledger, and booking confirmations without leaving the tower.",
    },
  ],
  servicesCta: "Start a booking",
  footerTagline:
    "One booking brain. Every carrier. Domestic + world — Nepal's AI-powered logistics middleman.",
};

const SLUG = "homepage";

function parseContent(raw: string): HomepageContent | null {
  try {
    const data = JSON.parse(raw) as Partial<HomepageContent>;
    if (!data?.heroHeadline || !Array.isArray(data.features)) return null;
    return {
      ...DEFAULT_HOMEPAGE,
      ...data,
      features: data.features as HomeFeature[],
      services: (data.services as HomeService[]) ?? DEFAULT_HOMEPAGE.services,
      towerAlerts: Array.isArray(data.towerAlerts)
        ? data.towerAlerts
        : DEFAULT_HOMEPAGE.towerAlerts,
    };
  } catch {
    return null;
  }
}

function cloneDefault(): HomepageContent {
  return {
    ...DEFAULT_HOMEPAGE,
    features: [...DEFAULT_HOMEPAGE.features],
    services: [...DEFAULT_HOMEPAGE.services],
    towerAlerts: [...DEFAULT_HOMEPAGE.towerAlerts],
  };
}

/** Public homepage copy — DB override or built-in defaults. */
export function getHomepageContent(): HomepageContent {
  try {
    const row = getDb()
      .prepare(`SELECT content_json FROM site_content WHERE slug = ?`)
      .get(SLUG) as { content_json: string } | undefined;
    if (!row) return cloneDefault();
    return parseContent(row.content_json) ?? cloneDefault();
  } catch (error) {
    console.error(
      "[homepage-content.ts:getHomepageContent]",
      error instanceof Error ? error.message : error,
    );
    return cloneDefault();
  }
}

/** Staff save — replaces full homepage JSON. */
export function saveHomepageContent(
  content: HomepageContent,
): { ok: true } | { error: string } {
  try {
    if (!content.heroHeadline?.trim() || !content.heroSubhead?.trim()) {
      return { error: "Hero headline and subhead are required." };
    }
    const now = new Date().toISOString();
    getDb()
      .prepare(
        `INSERT INTO site_content (slug, content_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           content_json = excluded.content_json,
           updated_at = excluded.updated_at`,
      )
      .run(SLUG, JSON.stringify(content), now);
    return { ok: true };
  } catch (error) {
    console.error(
      "[homepage-content.ts:saveHomepageContent]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not save homepage content." };
  }
}
