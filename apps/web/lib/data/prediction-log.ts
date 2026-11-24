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

type FinishedRow = {
  shipment_id: string;
  status: string;
  booked_at: string | null;
  delivered_at: string | null;
  eta_days_max: number | null;
};

/** ON_TIME / LATE against the promised days (half a day of grace); a return to sender counts as LATE. */
function outcomeOf(row: FinishedRow): "ON_TIME" | "LATE" | "CANCELLED" | null {
  if (row.status === "CANCELLED") return "CANCELLED";
  if (row.status === "RTO") return "LATE";
  const booked = Date.parse(row.booked_at ?? "");
  const delivered = Date.parse(row.delivered_at ?? "");
  if (Number.isNaN(booked) || Number.isNaN(delivered) || !row.eta_days_max) return null;
  return (delivered - booked) / 864e5 <= row.eta_days_max + 0.5 ? "ON_TIME" : "LATE";
}

/**
 * Adds the real outcome to predictions of finished shipments, turning the log into labelled
 * training data. Safe to run repeatedly; returns how many shipments were labelled.
 */
export async function labelOutcomes(): Promise<number> {
  try {
    const db = await getSql();
    const rows = (await db
      .prepare(
        `SELECT s.id as shipment_id, s.status,
                (SELECT MIN(te.occurred_at) FROM tracking_events te WHERE te.shipment_id = s.id) as booked_at,
                (SELECT MIN(te.occurred_at) FROM tracking_events te
                 WHERE te.shipment_id = s.id AND te.status = 'DELIVERED') as delivered_at,
                (SELECT qo.eta_days_max FROM quote_options qo WHERE qo.id = s.selected_quote_option_id) as eta_days_max
         FROM shipments s
         WHERE s.status IN ('DELIVERED', 'CANCELLED', 'RTO')
           AND EXISTS (SELECT 1 FROM prediction_log p WHERE p.shipment_id = s.id AND p.outcome IS NULL)
         ORDER BY s.updated_at DESC
         LIMIT 500`,
      )
      .all()) as FinishedRow[];
    const now = new Date().toISOString();
    let labelled = 0;
    for (const row of rows) {
      const outcome = outcomeOf(row);
      if (!outcome) continue;
      await db
        .prepare(`UPDATE prediction_log SET outcome = ?, outcome_at = ? WHERE shipment_id = ? AND outcome IS NULL`)
        .run(outcome, now, row.shipment_id);
      labelled += 1;
    }
    return labelled;
  } catch (error) {
    console.error("[prediction-log.ts:labelOutcomes]", error instanceof Error ? error.message : error);
    return 0;
  }
}
