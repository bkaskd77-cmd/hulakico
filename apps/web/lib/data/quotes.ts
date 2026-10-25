import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import { seedCarriers } from "@/lib/data/carriers";
import { replaceShipmentQuotes } from "@/lib/data/quote-persist";
import { billableKg, calculateQuoteAmount, lowestQuoteOption, pickRate } from "@/lib/domain/quoting";
import { loadServiceRates } from "@/lib/data/rate-cards";

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
  destination_country: string;
  destination_postal_code: string | null;
  weight_kg: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
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
        `SELECT id, status, lane, service_class, destination_city, destination_country, destination_postal_code,
                weight_kg, length_cm, width_cm, height_cm, wants_cod
         FROM shipments WHERE id = ? AND user_id = ?`,
      )
      .get(shipmentId, userId)) as ShipmentRow | undefined;

    if (!shipment) {
      throw new Error("Shipment not found.");
    }
    if (shipment.status !== "DRAFT" && shipment.status !== "QUOTED") {
      throw new Error("Quotes only allowed for draft or quoted shipments.");
    }

    const scopes =
      shipment.lane === "DOMESTIC" ? ["DOMESTIC", "BOTH"] : ["INTERNATIONAL", "BOTH"];
    const charged = billableKg(shipment.weight_kg, shipment.length_cm ?? 0, shipment.width_cm ?? 0, shipment.height_cm ?? 0, shipment.lane);

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

      const rates = await loadServiceRates(service.service_id);
      const rate = pickRate(rates, {
        lane: shipment.lane,
        country: shipment.destination_country,
        city: shipment.destination_city,
        postalCode: shipment.destination_postal_code ?? "",
      });
      if (!rate) continue;

      options.push({
        id: newId("qopt"),
        carrierId: service.carrier_id,
        carrierServiceId: service.service_id,
        carrierName: service.carrier_name,
        serviceName: service.service_name,
        currency: rate.currency,
        amount: calculateQuoteAmount(rate.baseAmount, rate.perKgAmount, charged),
        etaDaysMin: service.eta_days_min,
        etaDaysMax: service.eta_days_max,
        zoneLabel: rate.placeName || rate.zoneLabel,
      });
    }

    const chosen = lowestQuoteOption(options, shipment.lane);
    if (!chosen) throw new Error("No rate is set for this city yet.");
    chosen.serviceName = shipment.service_class === "EXPRESS" ? "Express" : "Standard";
    const quoteId = newId("qte");
    const now = new Date().toISOString();
    await replaceShipmentQuotes(db, shipmentId, quoteId, [chosen], now);
    const { carrierId: _c, carrierServiceId: _s, ...view } = chosen;

    return { quoteId, shipmentId, options: [view] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quote generation failed.";
    console.error("[quotes.ts:generateQuotesForShipment]", message);
    throw error instanceof Error ? error : new Error(message);
  }
}
