import type { Sql } from "@/lib/sql";
import type { QuoteOptionView } from "@/lib/data/quotes";

type BuiltOption = QuoteOptionView & {
  carrierId: string;
  carrierServiceId: string;
};

export async function replaceShipmentQuotes(
  db: Sql,
  shipmentId: string,
  quoteId: string,
  options: BuiltOption[],
  now: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .prepare(
        `DELETE FROM quote_options WHERE quote_id IN (SELECT id FROM quotes WHERE shipment_id = ?)`,
      )
      .run(shipmentId);
    await tx.prepare(`DELETE FROM quotes WHERE shipment_id = ?`).run(shipmentId);
    await tx
      .prepare(`INSERT INTO quotes (id, shipment_id, created_at) VALUES (?, ?, ?)`)
      .run(quoteId, shipmentId, now);

    for (const option of options) {
      await tx
        .prepare(
          `INSERT INTO quote_options
           (id, quote_id, carrier_id, carrier_service_id, carrier_name, service_name,
            currency, amount, eta_days_min, eta_days_max, zone_label)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
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

    await tx
      .prepare(`UPDATE shipments SET status = 'QUOTED', updated_at = ? WHERE id = ?`)
      .run(now, shipmentId);
  });
}
