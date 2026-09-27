import { cache } from "react";
import { INTERNATIONAL_LANES, type ShippingLane } from "@/lib/domain/international-lanes";
import { getSql } from "@/lib/sql";

const SLUG = "international-lanes";
const MAX = 100_000;
const STEPS = [
  "Send the destination city, the weight, and whether the box is documents or goods.",
  "The desk ranks partner options on price, speed, and the chance of a hold.",
  "Book, complete the invoice, and hand the box over in Kathmandu.",
  "Follow one Hulakico timeline. A customs question shows on that same page.",
];

export type LaneCopy = {
  slug: string;
  title: string;
  to: string;
  summary: string;
  transit: string;
  paperwork: string;
  steps: string;
  story: string;
};

function clean(value: unknown, fallback: string): string {
  const text = typeof value === "string" ? value.replace(/\u0000/g, "") : fallback;
  return text.length > MAX ? text.slice(0, MAX) : text;
}

function seed(lane: ShippingLane): Omit<LaneCopy, "slug" | "title" | "to"> {
  return {
    summary: lane.summary,
    transit: `${lane.transit}\n\nName the receiving city when you quote. The window on that quote is the one to trust.`,
    paperwork: lane.paperwork,
    steps: STEPS.join("\n"),
    story: "",
  };
}

function fromSaved(lane: ShippingLane, raw: unknown): LaneCopy {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const base = seed(lane);
  return {
    slug: lane.slug,
    title: lane.title,
    to: lane.to,
    summary: clean(row.summary, base.summary),
    transit: clean(row.transit, base.transit),
    paperwork: clean(row.paperwork, base.paperwork),
    steps: clean(row.steps, base.steps),
    story: clean(row.story, ""),
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
    const fields = [copy.summary, copy.transit, copy.paperwork, copy.steps, copy.story];
    if (fields.some((field) => field.length > MAX)) {
      return { error: "Each box can hold up to 100,000 characters." };
    }
    const saved = await loadSaved();
    saved[lane.slug] = {
      summary: copy.summary,
      transit: copy.transit,
      paperwork: copy.paperwork,
      steps: copy.steps,
      story: copy.story,
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
