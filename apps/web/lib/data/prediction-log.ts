import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import type { RiskFeatureItem } from "@/lib/data/tower-features";

/** One score per shipment per window is enough for training; Dashboard reloads must not flood the log. */
const LOG_EVERY_HOURS = 6;

export type LoggedPrediction = {
  features: RiskFeatureItem;
  score: number;
  level: string;
  model: string;
};

/**
 * Stores each delay-risk score with the features known at that moment, so a future model
 * learns only from what was knowable when the prediction was made. Never throws: a failed
 * write is logged and the Dashboard carries on.
 */
export async function logPredictions(rows: LoggedPrediction[]): Promise<void> {
  if (rows.length === 0) return;
  try {
    const db = await getSql();
    const now = new Date();
    const since = new Date(now.getTime() - LOG_EVERY_HOURS * 36e5).toISOString();
    const statement = db.prepare(
      `INSERT INTO prediction_log (id, shipment_id, model, scored_at, features_json, score, level)
       SELECT ?, ?, ?, ?, ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM prediction_log WHERE shipment_id = ? AND model = ? AND scored_at >= ?
       )`,
    );
    for (const row of rows) {
      const { id: shipmentId, ...features } = row.features;
      await statement.run(
        newId("prd"),
        shipmentId,
        row.model.slice(0, 40),
        now.toISOString(),
        JSON.stringify(features),
        row.score,
        row.level.slice(0, 12),
        shipmentId,
        row.model.slice(0, 40),
        since,
      );
    }
  } catch (error) {
    console.error("[prediction-log.ts:logPredictions]", error instanceof Error ? error.message : error);
  }
}
