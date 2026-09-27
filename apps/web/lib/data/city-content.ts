import { cache } from "react";
import { COMPANY_CONTACT } from "@/lib/data/info-pages";
import type { LaneCopy, LaneFact } from "@/lib/data/lane-content";
import { DOMESTIC_CITIES } from "@/lib/domain/domestic-cities";
import type { ShippingLane } from "@/lib/domain/international-lanes";
import { isAllowedImageUrl } from "@/lib/domain/homepage-rules";
import { getSql } from "@/lib/sql";

const SLUG = "domestic-cities";
const MAX = 100_000;
const STEPS = "Send the receiving address, the weight, and whether the box is documents or goods.\nThe desk quotes in NPR and shows the delivery window before you book.\nBook, then hand the box over in Kathmandu, or ask for a pickup on the quote.\nFollow one Hulakico timeline. Cash on delivery settles back to you only when the quote included it.";

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

function seed(city: ShippingLane): Omit<LaneCopy, "slug" | "title" | "to"> {
  const address = COMPANY_CONTACT.address.join(", ");
  return {
    summary: city.summary,
    transit: `${city.transit}\nName the ward when you quote. The window on that quote is the one to trust.`,
    paperwork: city.paperwork,
    steps: STEPS,
    story: "",
    handover: `${address}\n\nBring the box to the desk, or ask for a pickup when you request the quote.`,
    image: city.image,
    defaultImage: city.image,
    facts: [
      { label: "Route", value: `Kathmandu → ${city.to}` },
      { label: "Rate", value: "NPR. No fixed fare. The quote uses the higher of actual weight and volumetric weight (length × width × height in cm ÷ 6000)." },
      { label: "Record", value: "One Hulakico airway bill for the whole run." },
      { label: "COD", value: "Cash on delivery is offered only when that quote includes it." },
    ],
  };
}

function fromSaved(city: ShippingLane, raw: unknown): LaneCopy {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const base = seed(city);
  const image = typeof row.image === "string" ? row.image : base.image;
  return {
    slug: city.slug, title: city.title, to: city.to,
    summary: clean(row.summary, base.summary), transit: clean(row.transit, base.transit),
    paperwork: clean(row.paperwork, base.paperwork), steps: clean(row.steps, base.steps),
    story: clean(row.story, ""), handover: clean(row.handover, base.handover),
    image: image === "" || isAllowedImageUrl(image) ? image : base.image,
    defaultImage: city.image, facts: factsOf(row.facts, base.facts),
  };
}

async function loadSaved(): Promise<Record<string, unknown>> {
  try {
    const row = (await (await getSql()).prepare(`SELECT content_json FROM site_content WHERE slug = ?`).get(SLUG)) as { content_json: string } | undefined;
    if (!row) return {};
    const parsed = JSON.parse(row.content_json) as { lanes?: Record<string, unknown> };
    return parsed.lanes ?? {};
  } catch (error) {
    console.error("[city-content.ts:loadSaved]", error instanceof Error ? error.message : error);
    return {};
  }
}

function customBase(slug: string, raw: unknown): ShippingLane | null {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  const to = typeof row?.to === "string" ? row.to.trim().slice(0, 80) : "";
  if (to.length < 2) return null;
  const stored = row && typeof row.title === "string" ? row.title.trim() : "";
  const title = stored ? stored.slice(0, 120) : `Kathmandu to ${to}`;
  return { slug, to, title, summary: `Parcels from Kathmandu to ${to}.`, image: "/home/service-domestic.jpg", transit: "Road through domestic partners. The quote shows the window before you book.", paperwork: `Receiver name, phone, and a full address in ${to}.` };
}

async function loadCopies(): Promise<LaneCopy[]> {
  const saved = await loadSaved();
  const seeds = DOMESTIC_CITIES.map((city) => fromSaved(city, saved[city.slug]));
  const extras = Object.keys(saved).flatMap((slug) => DOMESTIC_CITIES.some((city) => city.slug === slug) ? [] : [customBase(slug, saved[slug])].filter((city): city is ShippingLane => !!city).map((city) => fromSaved(city, saved[slug])));
  return seeds.concat(extras);
}

export const getCityCopies = cache(loadCopies);

export async function getCityCopy(slug: string): Promise<LaneCopy | null> {
  return (await getCityCopies()).find((city) => city.slug === slug) ?? null;
}

export async function saveCityCopy(copy: LaneCopy): Promise<{ ok: true } | { error: string }> {
  try {
    const known = DOMESTIC_CITIES.some((item) => item.slug === copy.slug);
    const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(copy.slug);
    const fields = [copy.summary, copy.transit, copy.paperwork, copy.steps, copy.story, copy.handover];
    if (fields.some((field) => field.length > MAX)) return { error: "Each box can hold up to 100,000 characters." };
    if (copy.image && !isAllowedImageUrl(copy.image)) return { error: "Upload the photo through the editor." };
    const saved = await loadSaved();
    const previous = saved[copy.slug] && typeof saved[copy.slug] === "object" ? (saved[copy.slug] as Record<string, unknown>) : undefined;
    if (!known && !slugOk) return { error: "Use letters and numbers for the city." };
    const to = copy.to.trim().slice(0, 80) || (typeof previous?.to === "string" ? previous.to : "");
    const title = copy.title.trim().slice(0, 120) || (typeof previous?.title === "string" ? previous.title : to ? `Kathmandu to ${to}` : "");
    if (!known && to.length < 2) return { error: "Enter the city name." };
    if (!known && !previous && Object.keys(saved).length >= 40) return { error: "Up to 40 cities." };
    const body = { summary: copy.summary, transit: copy.transit, paperwork: copy.paperwork, steps: copy.steps, story: copy.story, handover: copy.handover, image: copy.image, facts: copy.facts.slice(0, 20) };
    saved[copy.slug] = known ? body : { ...body, to, title };
    await (await getSql()).prepare(`INSERT INTO site_content (slug, content_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(slug) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at`).run(SLUG, JSON.stringify({ lanes: saved }), new Date().toISOString());
    return { ok: true };
  } catch (error) {
    console.error("[city-content.ts:saveCityCopy]", error instanceof Error ? error.message : error);
    return { error: "Could not save this city page." };
  }
}
