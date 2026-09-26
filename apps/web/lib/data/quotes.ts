import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import { seedCarriers } from "@/lib/data/carriers";
import { replaceShipmentQuotes } from "@/lib/data/quote-persist";
import {
  calculateQuoteAmount,
  pickRateForZone,
  resolveZoneLabel,
} from "@/lib/domain/quoting";

export type QuoteOptionView = {
  id: string;
  carrierName: string;
  serviceName: string;
  currency: string;
  amount: number;
  etaDaysMin: number;
  etaDaysMax: number;
  zoneLabel: string;
};

type BuiltOption = QuoteOptionView & {
  carrierId: string;
  carrierServiceId: string;
};

type ShipmentRow = {
  id: string;
  status: string;
  lane: "DOMESTIC" | "INTERNATIONAL";
  service_class: string;
  destination_city: string;
  weight_kg: number;
  wants_cod: number;
};

export async function generateQuotesForShipment(
  userId: string,
  shipmentId: string,
): Promise<{ quoteId: string; shipmentId: string; options: QuoteOptionView[] }> {
  try {
    await seedCarriers();
    const db = await getSql();
    const shipment = (await db
      .prepare(
        `SELECT id, status, lane, service_class, destination_city, weight_kg, wants_cod
         FROM shipments WHERE id = ? AND user_id = ?`,
      )
      .get(shipmentId, userId)) as ShipmentRow | undefined;

    if (!shipment) {
      throw new Error("Shipment not found.");
    }
    if (shipment.status !== "DRAFT" && shipment.status !== "QUOTED") {
      throw new Error("Quotes only allowed for draft or quoted shipments.");
    }

    const preferredZone = resolveZoneLabel(
      shipment.lane,
      shipment.destination_city,
    );
    const scopes =
      shipment.lane === "DOMESTIC"
        ? ["DOMESTIC", "BOTH"]
        : ["INTERNATIONAL", "BOTH"];

    const services = (await db
      .prepare(
        `SELECT cs.id as service_id, cs.name as service_name,
                cs.eta_days_min, cs.eta_days_max, cs.supports_cod,
                c.id as carrier_id, c.name as carrier_name, c.scope
         FROM carrier_services cs
         JOIN carriers c ON c.id = cs.carrier_id
         WHERE c.is_active = 1 AND cs.service_class = ?`,
      )
      .all(shipment.service_class)) as Array<{
      service_id: string;
      service_name: string;
      eta_days_min: number;
      eta_days_max: number;
      supports_cod: number;
      carrier_id: string;
      carrier_name: string;
      scope: string;
    }>;

    const options: BuiltOption[] = [];
    for (const service of services) {
      if (!scopes.includes(service.scope)) continue;
      if (shipment.wants_cod === 1 && service.supports_cod !== 1) continue;

      const rates = (
        (await db
          .prepare(
            `SELECT currency, base_amount, per_kg_amount, zone_label
             FROM rate_cards WHERE carrier_service_id = ?`,
          )
          .all(service.service_id)) as Array<{
          currency: string;
          base_amount: number;
          per_kg_amount: number;
          zone_label: string;
        }>
      ).map((row) => ({
        currency: row.currency,
        baseAmount: row.base_amount,
        perKgAmount: row.per_kg_amount,
        zoneLabel: row.zone_label,
      }));

      const rate = pickRateForZone(rates, preferredZone);
      if (!rate) continue;

      options.push({
        id: newId("qopt"),
        carrierId: service.carrier_id,
        carrierServiceId: service.service_id,
        carrierName: service.carrier_name,
        serviceName: service.service_name,
        currency: rate.currency,
        amount: calculateQuoteAmount(
          rate.baseAmount,
          rate.perKgAmount,
          shipment.weight_kg,
        ),
        etaDaysMin: service.eta_days_min,
        etaDaysMax: service.eta_days_max,
        zoneLabel: rate.zoneLabel,
      });
    }

    if (options.length === 0) {
      throw new Error("No rate cards matched this shipment.");
    }

    options.sort((a, b) => a.amount - b.amount);
    const quoteId = newId("qte");
    const now = new Date().toISOString();
    await replaceShipmentQuotes(db, shipmentId, quoteId, options, now);

    return {
      quoteId,
      shipmentId,
      options: options.map(
        ({ carrierId: _c, carrierServiceId: _s, ...view }) => view,
      ),
    };
  } catch (error) {
    console.error(
      "[quotes.ts:generateQuotesForShipment]",
      error instanceof Error ? error.message : error,
    );
    throw error instanceof Error ? error : new Error("Quote generation failed.");
  }
}
