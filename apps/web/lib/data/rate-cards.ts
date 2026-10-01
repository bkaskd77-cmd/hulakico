import { newId } from "@/lib/domain/auth";
import { getSql } from "@/lib/sql";

const CURRENCIES = new Set(["NPR", "USD"]);

export const RATE_ZONES = [
  "valley", "major_city", "nationwide",
  "india", "gulf", "east_asia", "europe", "americas", "oceania", "world",
] as const;

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

export async function insertRateCard(
  input: Money & { carrierServiceId: string; zoneLabel: string },
): Promise<{ ok: true } | { error: string }> {
  try {
    const serviceId = input.carrierServiceId.trim();
    const zoneLabel = input.zoneLabel.trim();
    const money = readMoney(input);
    if ("error" in money) return money;
    if (!serviceId || !(RATE_ZONES as readonly string[]).includes(zoneLabel)) {
      return { error: "Choose a service and a zone." };
    }
    const db = await getSql();
    const service = await db.prepare("SELECT id FROM carrier_services WHERE id = ?").get(serviceId);
    if (!service) return { error: "Carrier service not found." };
    const duplicate = await db
      .prepare("SELECT id FROM rate_cards WHERE carrier_service_id = ? AND zone_label = ?")
      .get(serviceId, zoneLabel);
    if (duplicate) return { error: "This service already has a card for that zone." };
    await db
      .prepare(
        `INSERT INTO rate_cards (id, carrier_service_id, currency, base_amount, per_kg_amount, zone_label)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(newId("rate"), serviceId, money.currency, money.baseAmount, money.perKgAmount, zoneLabel);
    return { ok: true };
  } catch (error) {
    console.error("[rate-cards.ts:insertRateCard]", error instanceof Error ? error.message : error);
    return { error: "Could not add the rate card." };
  }
}
