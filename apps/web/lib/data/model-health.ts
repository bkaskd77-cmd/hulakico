import { getSql } from "@/lib/sql";

/** Labelled deliveries needed before a trained model is worth testing, and late ones among them. */
export const TRAINING_TARGET = { labelled: 300, late: 30 };

export type LevelRow = { level: string; onTime: number; late: number };

export type ModelHealth = {
  predictions: number;
  shipmentsScored: number;
  onTime: number;
  late: number;
  cancelled: number;
  waiting: number;
  levels: LevelRow[];
};

const LEVEL_ORDER = ["LOW", "MEDIUM", "HIGH"];

/**
 * How the delay-risk model is doing and how close the data is to training a real model.
 * Uses each shipment's first score, the one made closest to booking, so later scores
 * (made once a delay is already visible) do not flatter the results.
 */
export async function loadModelHealth(): Promise<ModelHealth> {
  try {
    const db = await getSql();
    const totals = (await db
      .prepare(
        `SELECT COUNT(*) as predictions,
                COUNT(DISTINCT shipment_id) as shipments,
                COUNT(DISTINCT CASE WHEN outcome = 'ON_TIME' THEN shipment_id END) as on_time,
                COUNT(DISTINCT CASE WHEN outcome = 'LATE' THEN shipment_id END) as late,
                COUNT(DISTINCT CASE WHEN outcome = 'CANCELLED' THEN shipment_id END) as cancelled,
                COUNT(DISTINCT CASE WHEN outcome IS NULL THEN shipment_id END) as waiting
         FROM prediction_log`,
      )
      .get()) as Record<string, number> | undefined;
    const byLevel = (await db
      .prepare(
        `SELECT p.level, p.outcome, COUNT(*) as n
         FROM prediction_log p
         WHERE p.outcome IN ('ON_TIME', 'LATE')
           AND p.scored_at = (SELECT MIN(q.scored_at) FROM prediction_log q WHERE q.shipment_id = p.shipment_id)
         GROUP BY p.level, p.outcome`,
      )
      .all()) as Array<{ level: string; outcome: string; n: number }>;
    const levels = LEVEL_ORDER.map((level) => ({
      level,
      onTime: Number(byLevel.find((row) => row.level === level && row.outcome === "ON_TIME")?.n ?? 0),
      late: Number(byLevel.find((row) => row.level === level && row.outcome === "LATE")?.n ?? 0),
    }));
    return {
      predictions: Number(totals?.predictions ?? 0),
      shipmentsScored: Number(totals?.shipments ?? 0),
      onTime: Number(totals?.on_time ?? 0),
      late: Number(totals?.late ?? 0),
      cancelled: Number(totals?.cancelled ?? 0),
      waiting: Number(totals?.waiting ?? 0),
      levels,
    };
  } catch (error) {
    console.error("[model-health.ts:loadModelHealth]", error instanceof Error ? error.message : error);
    throw new Error("Could not load model health.");
  }
}
