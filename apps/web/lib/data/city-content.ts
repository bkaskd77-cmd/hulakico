import { readSiteContent, writeSiteContent } from "@/lib/data/site-content-store";
import { cache } from "react";
import { getCompanyContact } from "@/lib/data/company-contact-content";
import type { LaneCopy, LaneFact } from "@/lib/data/lane-content";
import { DOMESTIC_CITIES } from "@/lib/domain/domestic-cities";
import type { ShippingLane } from "@/lib/domain/international-lanes";
import { isAllowedImageUrl } from "@/lib/domain/homepage-rules";

const SLUG = "domestic-cities";
const MAX = 100_000;
const STEPS = "Send the receiving address, the weight, and whether the box is documents or goods.\nWe give you the price in NPR and the delivery date before you book.\nPay, then hand the box over in Kathmandu, or ask for a pickup.\nTrack it on one Hulakico tracking page. Cash on delivery is paid back to you when your booking included it.";

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

/** Default copy. `address` is the saved office address from Admin → Contact. */
function seed(city: ShippingLane, address: string): Omit<LaneCopy, "slug" | "title" | "to"> {
  return {
    summary: city.summary,
    transit: city.transit,
    paperwork: city.paperwork,
    steps: STEPS,
    story: "",
    handover: `${address}\n\nBring the box to our desk, or request a pickup when you ask for a price.`,
    image: city.image,
    defaultImage: city.image,
    facts: [
      { label: "Route", value: `Kathmandu → ${city.to}` },
      { label: "Rate", value: "In NPR. No fixed fare. The price uses the higher of actual weight and volumetric weight (length × width × height in cm ÷ 6000)." },
      { label: "Record", value: "One Hulakico air waybill (AWB) for the whole journey." },
      { label: "COD", value: "Available on some routes. It shows at booking when it is offered." },
    ],
  };
}

function fromSaved(city: ShippingLane, raw: unknown, address: string): LaneCopy {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const base = seed(city, address);
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
    const row = (await readSiteContent(SLUG)) as { content_json: string } | undefined;
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
  return { slug, to, title, summary: `Parcels from Kathmandu to ${to}.`, image: "/home/service-domestic.jpg", transit: "By road with a domestic courier partner. The price shows the delivery date before you book.", paperwork: `Receiver name, phone, and a full address in ${to}.` };
}

async function loadCopies(): Promise<LaneCopy[]> {
  const saved = await loadSaved();
  const address = (await getCompanyContact()).address.join(", ");
  const seeds = DOMESTIC_CITIES.map((city) => fromSaved(city, saved[city.slug], address));
  const extras = Object.keys(saved).flatMap((slug) => DOMESTIC_CITIES.some((city) => city.slug === slug) ? [] : [customBase(slug, saved[slug])].filter((city): city is ShippingLane => !!city).map((city) => fromSaved(city, saved[slug], address)));
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
    // Shipments leave from Kathmandu, so it cannot be a destination page of its own.
    if (!known && /^kathmandu/i.test(to)) return { error: "Kathmandu is where shipments start. Add a destination city instead." };
    if (!known && !previous && Object.keys(saved).length >= 40) return { error: "Up to 40 cities." };
    const body = { summary: copy.summary, transit: copy.transit, paperwork: copy.paperwork, steps: copy.steps, story: copy.story, handover: copy.handover, image: copy.image, facts: copy.facts.slice(0, 20) };
    saved[copy.slug] = known ? body : { ...body, to, title };
    await writeSiteContent(SLUG, JSON.stringify({ lanes: saved }));
    return { ok: true };
  } catch (error) {
    console.error("[city-content.ts:saveCityCopy]", error instanceof Error ? error.message : error);
    return { error: "Could not save this city page." };
  }
}

/** Removes a city page staff added. The built-in cities stay; their text can be edited. */
export async function removeCityCopy(slug: string): Promise<{ ok: true } | { error: string }> {
  try {
    if (DOMESTIC_CITIES.some((item) => item.slug === slug)) return { error: "Built-in city pages cannot be removed." };
    const saved = await loadSaved();
    if (!saved[slug]) return { error: "City page not found." };
    delete saved[slug];
    await writeSiteContent(SLUG, JSON.stringify({ lanes: saved }));
    return { ok: true };
  } catch (error) {
    console.error("[city-content.ts:removeCityCopy]", error instanceof Error ? error.message : error);
    return { error: "Could not remove this city page." };
  }
}
