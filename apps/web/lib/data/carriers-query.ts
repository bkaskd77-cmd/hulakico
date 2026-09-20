import { getDb } from "@/lib/db";
import { seedCarriers } from "@/lib/data/carriers";
import type {
  CarrierRecord,
  CarrierServiceRecord,
  RateCardRecord,
} from "@/lib/domain/carrier-types";

export function listCarriersWithDetails(): Array<
  CarrierRecord & {
    services: Array<CarrierServiceRecord & { rates: RateCardRecord[] }>;
  }
> {
  try {
    seedCarriers();
    const db = getDb();
    const carriers = db
      .prepare(
        `SELECT id, code, name, transport_mode, scope, is_active, adapter_key
         FROM carriers ORDER BY name`,
      )
      .all() as Array<{
      id: string;
      code: string;
      name: string;
      transport_mode: CarrierRecord["transportMode"];
      scope: CarrierRecord["scope"];
      is_active: number;
      adapter_key: string;
    }>;

    return carriers.map((carrier) => {
      const services = db
        .prepare(
          `SELECT id, carrier_id, code, name, service_class, eta_days_min, eta_days_max, supports_cod
           FROM carrier_services WHERE carrier_id = ? ORDER BY name`,
        )
        .all(carrier.id) as Array<{
        id: string;
        carrier_id: string;
        code: string;
        name: string;
        service_class: CarrierServiceRecord["serviceClass"];
        eta_days_min: number;
        eta_days_max: number;
        supports_cod: number;
      }>;

      return {
        id: carrier.id,
        code: carrier.code,
        name: carrier.name,
        transportMode: carrier.transport_mode,
        scope: carrier.scope,
        isActive: carrier.is_active === 1,
        adapterKey: carrier.adapter_key,
        services: services.map((service) => {
          const rates = db
            .prepare(
              `SELECT id, carrier_service_id, currency, base_amount, per_kg_amount, zone_label
               FROM rate_cards WHERE carrier_service_id = ?`,
            )
            .all(service.id) as Array<{
            id: string;
            carrier_service_id: string;
            currency: string;
            base_amount: number;
            per_kg_amount: number;
            zone_label: string;
          }>;

          return {
            id: service.id,
            carrierId: service.carrier_id,
            code: service.code,
            name: service.name,
            serviceClass: service.service_class,
            etaDaysMin: service.eta_days_min,
            etaDaysMax: service.eta_days_max,
            supportsCod: service.supports_cod === 1,
            rates: rates.map((rate) => ({
              id: rate.id,
              carrierServiceId: rate.carrier_service_id,
              currency: rate.currency,
              baseAmount: rate.base_amount,
              perKgAmount: rate.per_kg_amount,
              zoneLabel: rate.zone_label,
            })),
          };
        }),
      };
    });
  } catch (error) {
    console.error(
      "[carriers-query.ts:listCarriersWithDetails]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not list carriers.");
  }
}
