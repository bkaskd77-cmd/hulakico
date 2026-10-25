import { ensureCarrierService } from "@/lib/data/carrier-admin";
import { newId } from "@/lib/domain/auth";
import { ANY_CITY, normalizePlaceName, parsePostalCodes } from "@/lib/domain/quoting";
import { getSql } from "@/lib/sql";

const CURRENCIES = new Set(["NPR", "USD"]);
const LANES = new Set(["DOMESTIC", "INTERNATIONAL"]);

type Money = { currency: string; baseAmount: number; perKgAmount: number };

function readMoney(input: Money): { error: string } | { currency: string; baseAmount: number; perKgAmount: number } {
  const currency = input.currency.trim().toUpperCase();
  const baseAmount = Math.round(input.baseAmount * 100) / 100;
  const perKgAmount = Math.round(input.perKgAmount * 100) / 100;
  if (!CURRENCIES.has(currency)) return { error: "Currency must be NPR or USD." };
  if (!Number.isFinite(baseAmount) || baseAmount < 0 || baseAmount > 1_000_000) {
    return { error: "Enter a valid minimum charge." };
  }
  if (!Number.isFinite(perKgAmount) || perKgAmount < 0 || perKgAmount > 100_000) {
    return { error: "Enter a valid per-kg amount." };
  }
  return { currency, baseAmount, perKgAmount };
}

export async function updateRateCard(
  input: Money & { id: string; postalCodes?: string },
): Promise<{ ok: true } | { error: string }> {
  try {
    const id = input.id.trim();
    const money = readMoney(input);
    if ("error" in money) return money;
    if (!id || id.length > 80) return { error: "Unknown rate card." };
    const db = await getSql();
    const existing = await db.prepare("SELECT id FROM rate_cards WHERE id = ?").get(id);
    if (!existing) return { error: "Rate card not found." };
    await db
      .prepare(`UPDATE rate_cards SET currency = ?, base_amount = ?, per_kg_amount = ?, postal_codes = ? WHERE id = ?`)
      .run(money.currency, money.baseAmount, money.perKgAmount, parsePostalCodes(input.postalCodes ?? "").join(", ") || null, id);
    return { ok: true };
  } catch (error) {
    console.error("[rate-cards.ts:updateRateCard]", error instanceof Error ? error.message : error);
    return { error: "Could not save the rate card." };
  }
}

// Nepal hubs that can never be an international destination.
const NEPAL_CITY_KEYS = new Set(["kathmandu", "lalitpur", "patan", "bhaktapur", "pokhara", "biratnagar", "birgunj", "dharan", "butwal", "bharatpur", "chitwan", "nepalgunj", "dhangadhi", "hetauda", "janakpur", "itahari"]);

type RatePlaceInput = { lane: string; placeName: string; country: string; postalCodes: string; allOtherCities: boolean };

/** Checks lane, country, city, and postal codes together; returns what to store or why not. */
export function checkRatePlace(input: RatePlaceInput):
  | { lane: string; country: string; placeName: string; zoneLabel: string; postalCodes: string | null }
  | { error: string } {
  const lane = input.lane.trim().toUpperCase();
  if (!LANES.has(lane)) return { error: "Choose National or International." };
  const country = lane === "DOMESTIC" ? "NP" : input.country.trim().toUpperCase();
  if (lane === "INTERNATIONAL" && (!/^[A-Z]{2}$/.test(country) || country === "NP")) {
    return { error: "International rates need a destination country other than Nepal." };
  }
  const postal = parsePostalCodes(input.postalCodes);
  if (input.allOtherCities) {
    return { lane, country, placeName: "All other cities", zoneLabel: ANY_CITY, postalCodes: postal.length ? postal.join(", ") : null };
  }
  const placeName = input.placeName.trim().replace(/\s+/g, " ");
  const zoneLabel = normalizePlaceName(placeName);
  if (zoneLabel.length < 2 || zoneLabel.length > 80 || !/^[\p{L}\p{N}][\p{L}\p{N} .'-]*$/u.test(placeName)) {
    return { error: "Enter a city name." };
  }
  if (lane === "INTERNATIONAL" && NEPAL_CITY_KEYS.has(zoneLabel)) {
    return { error: `${placeName} is in Nepal. Use National for it, or enter a city abroad.` };
  }
  return { lane, country, placeName, zoneLabel, postalCodes: postal.length ? postal.join(", ") : null };
}

export async function insertCityRate(
  input: Money & { carrierId: string; serviceClass: string } & RatePlaceInput,
): Promise<{ ok: true } | { error: string }> {
  try {
    const place = checkRatePlace(input);
    if ("error" in place) return place;
    const { lane, country, placeName, zoneLabel, postalCodes } = place;
    const money = readMoney(input);
    if ("error" in money) return money;
    const ready = await ensureCarrierService({
      carrierId: input.carrierId,
      serviceClass: input.serviceClass,
      lane,
    });
    if ("error" in ready) return ready;
    const serviceId = ready.serviceId;
    const db = await getSql();
    const duplicate = await db
      .prepare(
        `SELECT id FROM rate_cards
         WHERE carrier_service_id = ? AND zone_label = ? AND lane = ? AND COALESCE(country, '') = ?`,
      )
      .get(serviceId, zoneLabel, lane, country);
    if (duplicate) return { error: "This service already has a card for that city and country." };
    await db
      .prepare(
        `INSERT INTO rate_cards
         (id, carrier_service_id, currency, base_amount, per_kg_amount, zone_label, lane, place_name, country, postal_codes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(newId("rate"), serviceId, money.currency, money.baseAmount, money.perKgAmount, zoneLabel, lane, placeName, country, postalCodes);
    return { ok: true };
  } catch (error) {
    console.error("[rate-cards.ts:insertCityRate]", error instanceof Error ? error.message : error);
    return { error: "Could not add the rate card." };
  }
}

export type ServiceRate = {
  currency: string;
  baseAmount: number;
  perKgAmount: number;
  zoneLabel: string;
  lane: string | null;
  placeName: string | null;
  country: string | null;
  postalCodes: string | null;
};

/** Every rate-card row for one carrier service, ready for pickRate(). */
export async function loadServiceRates(serviceId: string): Promise<ServiceRate[]> {
  try {
    const rows = (await (await getSql())
      .prepare(
        `SELECT currency, base_amount, per_kg_amount, zone_label, lane, place_name, country, postal_codes
         FROM rate_cards WHERE carrier_service_id = ?`,
      )
      .all(serviceId)) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      currency: String(row.currency),
      baseAmount: Number(row.base_amount),
      perKgAmount: Number(row.per_kg_amount),
      zoneLabel: String(row.zone_label),
      lane: row.lane ? String(row.lane) : null,
      placeName: row.place_name ? String(row.place_name) : null,
      // Older national rows have no country; they are Nepal by definition.
      country: row.country ? String(row.country) : row.lane === "DOMESTIC" ? "NP" : null,
      postalCodes: row.postal_codes ? String(row.postal_codes) : null,
    }));
  } catch (error) {
    console.error("[rate-cards.ts:loadServiceRates]", error instanceof Error ? error.message : error);
    return [];
  }
}
