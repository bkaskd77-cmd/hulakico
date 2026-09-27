import { cache } from "react";
import { COMPANY_CONTACT } from "@/lib/data/info-pages";
import { INTERNATIONAL_LANES, type ShippingLane } from "@/lib/domain/international-lanes";
import { isAllowedImageUrl } from "@/lib/domain/homepage-rules";
import { getSql } from "@/lib/sql";

const SLUG = "international-lanes";
const MAX = 100_000;
const STEPS = [
  "Send the destination city, the weight, and whether the box is documents or goods.",
  "The desk ranks partner options on price, speed, and the chance of a hold.",
  "Book, complete the invoice, and hand the box over in Kathmandu.",
  "Follow one Hulakico timeline. A customs question shows on that same page.",
];

export type LaneFact = { label: string; value: string };

export type LaneCopy = {
  slug: string;
  title: string;
  to: string;
  summary: string;
  transit: string;
  paperwork: string;
  steps: string;
  story: string;
  handover: string;
  image: string;
  defaultImage: string;
  facts: LaneFact[];
};

function clean(value: unknown, fallback: string): string {
  const text = typeof value === "string" ? value.replace(/\u0000/g, "") : fallback;
  return text.length > MAX ? text.slice(0, MAX) : text;
}

function factsOf(value: unknown, fallback: LaneFact[]): LaneFact[] {
  if (!Array.isArray(value)) return fallback;
  return value.slice(0, 20).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const label = clean(row.label, "").trim().slice(0, 80);
    const text = clean(row.value, "");
    return label || text ? [{ label, value: text }] : [];
  });
}

function seed(lane: ShippingLane): Omit<LaneCopy, "slug" | "title" | "to"> {
  const address = COMPANY_CONTACT.address.join(", ");
  return {
    summary: lane.summary,
    transit: `${lane.transit}\nName the receiving city when you quote. The window on that quote is the one to trust.`,
    paperwork: lane.paperwork,
    steps: STEPS.join("\n"),
    story: "",
    handover: `${address}\n\nBring the box to the desk, or ask for a pickup when you request the quote.`,
    image: lane.image,
    defaultImage: lane.image,
    facts: [
      { label: "Route", value: `Kathmandu, Nepal → ${lane.to}` },
      { label: "Rate", value: "No fixed fare. The quote uses the higher of actual weight and volumetric weight (length × width × height in cm ÷ 5000)." },
      { label: "Record", value: "One Hulakico airway bill for the journey. A partner bill is added after pickup." },
    ],
  };
}

function fromSaved(lane: ShippingLane, raw: unknown): LaneCopy {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const base = seed(lane);
  const image = typeof row.image === "string" ? row.image : base.image;
  return {
    slug: lane.slug,
    title: lane.title,
    to: lane.to,
    summary: clean(row.summary, base.summary),
    transit: clean(row.transit, base.transit),
    paperwork: clean(row.paperwork, base.paperwork),
    steps: clean(row.steps, base.steps),
    story: clean(row.story, ""),
    handover: clean(row.handover, base.handover),
    image: image === "" || isAllowedImageUrl(image) ? image : base.image,
    defaultImage: lane.image,
    facts: factsOf(row.facts, base.facts),
  };
}

async function loadSaved(): Promise<Record<string, unknown>> {
  try {
    const row = (await (await getSql())
      .prepare(`SELECT content_json FROM site_content WHERE slug = ?`)
      .get(SLUG)) as { content_json: string } | undefined;
    if (!row) return {};
    const parsed = JSON.parse(row.content_json) as { lanes?: Record<string, unknown> };
    return parsed.lanes ?? {};
  } catch (error) {
    console.error("[lane-content.ts:loadSaved]", error instanceof Error ? error.message : error);
    return {};
  }
}

async function loadCopies(): Promise<LaneCopy[]> {
  const saved = await loadSaved();
  return INTERNATIONAL_LANES.map((lane) => fromSaved(lane, saved[lane.slug]));
}

export const getLaneCopies = cache(loadCopies);

export async function getLaneCopy(slug: string): Promise<LaneCopy | null> {
  const copies = await getLaneCopies();
  return copies.find((lane) => lane.slug === slug) ?? null;
}

export async function saveLaneCopy(copy: LaneCopy): Promise<{ ok: true } | { error: string }> {
  try {
    const lane = INTERNATIONAL_LANES.find((item) => item.slug === copy.slug);
    if (!lane) return { error: "That destination is not on the international page." };
    const fields = [copy.summary, copy.transit, copy.paperwork, copy.steps, copy.story, copy.handover];
    if (fields.some((field) => field.length > MAX)) return { error: "Each box can hold up to 100,000 characters." };
    if (copy.image && !isAllowedImageUrl(copy.image)) return { error: "Upload the photo through the editor." };
    const saved = await loadSaved();
    saved[lane.slug] = {
      summary: copy.summary,
      transit: copy.transit,
      paperwork: copy.paperwork,
      steps: copy.steps,
      story: copy.story,
      handover: copy.handover,
      image: copy.image,
      facts: copy.facts.slice(0, 20),
    };
    await (await getSql())
      .prepare(
        `INSERT INTO site_content (slug, content_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           content_json = excluded.content_json,
           updated_at = excluded.updated_at`,
      )
      .run(SLUG, JSON.stringify({ lanes: saved }), new Date().toISOString());
    return { ok: true };
  } catch (error) {
    console.error("[lane-content.ts:saveLaneCopy]", error instanceof Error ? error.message : error);
    return { error: "Could not save this destination page." };
  }
}
