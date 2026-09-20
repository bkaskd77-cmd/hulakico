import type { DatabaseSync } from "node:sqlite";
import type { QuoteOptionView } from "@/lib/data/quotes";

type BuiltOption = QuoteOptionView & {
  carrierId: string;
  carrierServiceId: string;
};

export function replaceShipmentQuotes(
  db: DatabaseSync,
  shipmentId: string,
  quoteId: string,
  options: BuiltOption[],
  now: string,
): void {
  db.prepare(
    `DELETE FROM quote_options WHERE quote_id IN (SELECT id FROM quotes WHERE shipment_id = ?)`,
  ).run(shipmentId);
  db.prepare(`DELETE FROM quotes WHERE shipment_id = ?`).run(shipmentId);
  db.prepare(
    `INSERT INTO quotes (id, shipment_id, created_at) VALUES (?, ?, ?)`,
  ).run(quoteId, shipmentId, now);

  for (const option of options) {
    db.prepare(
      `INSERT INTO quote_options
       (id, quote_id, carrier_id, carrier_service_id, carrier_name, service_name,
        currency, amount, eta_days_min, eta_days_max, zone_label)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      option.id,
      quoteId,
      option.carrierId,
      option.carrierServiceId,
      option.carrierName,
      option.serviceName,
      option.currency,
      option.amount,
      option.etaDaysMin,
      option.etaDaysMax,
      option.zoneLabel,
    );
  }

  db.prepare(
    `UPDATE shipments SET status = 'QUOTED', updated_at = ? WHERE id = ?`,
  ).run(now, shipmentId);
}
