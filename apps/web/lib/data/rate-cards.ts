import { newId } from "@/lib/domain/auth";
import { normalizePlaceName } from "@/lib/domain/quoting";
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
  input: Money & { id: string },
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
      .prepare(`UPDATE rate_cards SET currency = ?, base_amount = ?, per_kg_amount = ? WHERE id = ?`)
      .run(money.currency, money.baseAmount, money.perKgAmount, id);
    return { ok: true };
  } catch (error) {
    console.error("[rate-cards.ts:updateRateCard]", error instanceof Error ? error.message : error);
    return { error: "Could not save the rate card." };
  }
}

function laneFits(scope: string, lane: string): boolean {
  return scope === "BOTH" || scope === lane;
}

export async function insertCityRate(
  input: Money & { carrierServiceId: string; lane: string; placeName: string },
): Promise<{ ok: true } | { error: string }> {
  try {
    const serviceId = input.carrierServiceId.trim();
    const lane = input.lane.trim().toUpperCase();
    const placeName = input.placeName.trim().replace(/\s+/g, " ");
    const zoneLabel = normalizePlaceName(placeName);
    const money = readMoney(input);
    if ("error" in money) return money;
    if (!serviceId || !LANES.has(lane) || zoneLabel.length < 2 || zoneLabel.length > 80) {
      return { error: "Choose a service, National or International, and a city." };
    }
    if (!/^[\p{L}\p{N}][\p{L}\p{N} .'-]*$/u.test(placeName)) {
      return { error: "Enter a city name." };
    }
    const db = await getSql();
    const service = (await db
      .prepare(
        `SELECT c.scope AS scope FROM carrier_services cs
         JOIN carriers c ON c.id = cs.carrier_id WHERE cs.id = ?`,
      )
      .get(serviceId)) as { scope: string } | undefined;
    if (!service) return { error: "Carrier service not found." };
    if (!laneFits(service.scope, lane)) {
      return { error: "That carrier does not cover this National or International choice." };
    }
    const duplicate = await db
      .prepare(
        `SELECT id FROM rate_cards
         WHERE carrier_service_id = ? AND zone_label = ? AND lane = ?`,
      )
      .get(serviceId, zoneLabel, lane);
    if (duplicate) return { error: "This service already has a card for that city." };
    await db
      .prepare(
        `INSERT INTO rate_cards
         (id, carrier_service_id, currency, base_amount, per_kg_amount, zone_label, lane, place_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(newId("rate"), serviceId, money.currency, money.baseAmount, money.perKgAmount, zoneLabel, lane, placeName);
    return { ok: true };
  } catch (error) {
    console.error("[rate-cards.ts:insertCityRate]", error instanceof Error ? error.message : error);
    return { error: "Could not add the rate card." };
  }
}
