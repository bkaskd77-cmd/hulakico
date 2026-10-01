import { getSql } from "@/lib/sql";

const CURRENCIES = new Set(["NPR", "USD"]);

export type RateCardUpdate = {
  id: string;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
};

export async function updateRateCard(
  input: RateCardUpdate,
): Promise<{ ok: true } | { error: string }> {
  try {
    const id = input.id.trim();
    const currency = input.currency.trim().toUpperCase();
    const baseAmount = Math.round(input.baseAmount * 100) / 100;
    const perKgAmount = Math.round(input.perKgAmount * 100) / 100;
    if (!id || id.length > 80) return { error: "Unknown rate card." };
    if (!CURRENCIES.has(currency)) return { error: "Currency must be NPR or USD." };
    if (!Number.isFinite(baseAmount) || baseAmount < 0 || baseAmount > 1_000_000) {
      return { error: "Enter a valid minimum charge." };
    }
    if (!Number.isFinite(perKgAmount) || perKgAmount < 0 || perKgAmount > 100_000) {
      return { error: "Enter a valid per-kg amount." };
    }

    const db = await getSql();
    const existing = await db.prepare("SELECT id FROM rate_cards WHERE id = ?").get(id);
    if (!existing) return { error: "Rate card not found." };
    await db
      .prepare(
        `UPDATE rate_cards SET currency = ?, base_amount = ?, per_kg_amount = ? WHERE id = ?`,
      )
      .run(currency, baseAmount, perKgAmount, id);
    return { ok: true };
  } catch (error) {
    console.error(
      "[rate-cards.ts:updateRateCard]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not save the rate card." };
  }
}
