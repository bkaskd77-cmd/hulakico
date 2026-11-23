import { lowestQuoteOption } from "@/lib/domain/quoting";

/** A partner's delivered history on this route; null when it has none yet. */
export type PartnerRecord = { onTime: number; delivered: number } | null;

type Candidate = { amount: number; currency: string; etaDaysMin: number; etaDaysMax: number };

/** Partners priced more than this above the cheapest are never chosen. */
export const PRICE_BAND = 0.1;
const PRIOR_ON_TIME = 0.8;
const PRIOR_WEIGHT = 10;
const WEIGHTS = { reliability: 0.5, price: 0.35, speed: 0.15 };

/** Learned on-time rate: starts at 80% and moves toward the real record as deliveries add up. */
export function onTimeRate(record: PartnerRecord): number {
  const delivered = Math.max(0, record?.delivered ?? 0);
  const onTime = Math.min(delivered, Math.max(0, record?.onTime ?? 0));
  return (onTime + PRIOR_ON_TIME * PRIOR_WEIGHT) / (delivered + PRIOR_WEIGHT);
}

/** 1 for the best value in the group, 0 for the worst; all 1 when they are equal. */
function lowIsBetter(value: number, values: number[]): number {
  const low = Math.min(...values);
  const span = Math.max(...values) - low;
  return span <= 1e-9 ? 1 : 1 - (value - low) / span;
}

/**
 * Picks the partner for a booking. Only partners within 10% of the cheapest price compete;
 * among them price, delivery speed, and the learned on-time rate are weighed. With no
 * history every partner scores the same on reliability, so price and speed decide.
 */
export function choosePartner<T extends Candidate>(
  options: T[],
  lane: "DOMESTIC" | "INTERNATIONAL",
  recordOf: (option: T) => PartnerRecord,
): T | null {
  const cheapest = lowestQuoteOption(options, lane);
  if (!cheapest) return null;
  const band = options.filter(
    (option) => option.currency === cheapest.currency && option.amount <= cheapest.amount * (1 + PRICE_BAND),
  );
  if (band.length === 1) return cheapest;
  const speeds = band.map((option) => (option.etaDaysMin + option.etaDaysMax) / 2);
  const scored = band.map((option, index) => ({
    option,
    score:
      // Price counts against the band, so a 5% gap costs half the price weight, not all of it.
      WEIGHTS.price * (1 - (option.amount - cheapest.amount) / (cheapest.amount * PRICE_BAND || 1)) +
      WEIGHTS.speed * lowIsBetter(speeds[index], speeds) +
      WEIGHTS.reliability * onTimeRate(recordOf(option)),
  }));
  scored.sort((a, b) => b.score - a.score || a.option.amount - b.option.amount);
  return scored[0].option;
}
