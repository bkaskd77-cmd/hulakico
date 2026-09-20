import { getDb } from "@/lib/db";
import type { QuoteOptionView } from "@/lib/data/quotes";

export function getLatestQuoteOptions(
  userId: string,
  shipmentId: string,
): QuoteOptionView[] {
  try {
    const db = getDb();
    const owned = db
      .prepare(`SELECT id FROM shipments WHERE id = ? AND user_id = ?`)
      .get(shipmentId, userId);
    if (!owned) {
      return [];
    }

    const quote = db
      .prepare(
        `SELECT id FROM quotes WHERE shipment_id = ? ORDER BY created_at DESC LIMIT 1`,
      )
      .get(shipmentId) as { id: string } | undefined;
    if (!quote) {
      return [];
    }

    return (
      db
        .prepare(
          `SELECT id, carrier_name, service_name, currency, amount,
                  eta_days_min, eta_days_max, zone_label
           FROM quote_options WHERE quote_id = ? ORDER BY amount ASC`,
        )
        .all(quote.id) as Array<{
        id: string;
        carrier_name: string;
        service_name: string;
        currency: string;
        amount: number;
        eta_days_min: number;
        eta_days_max: number;
        zone_label: string;
      }>
    ).map((row) => ({
      id: row.id,
      carrierName: row.carrier_name,
      serviceName: row.service_name,
      currency: row.currency,
      amount: row.amount,
      etaDaysMin: row.eta_days_min,
      etaDaysMax: row.eta_days_max,
      zoneLabel: row.zone_label,
    }));
  } catch (error) {
    console.error(
      "[quote-query.ts:getLatestQuoteOptions]",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
