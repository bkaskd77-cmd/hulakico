import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";
import { CARRIER_SEED } from "@/lib/data/carrier-seed";

export function seedCarriers(): { seeded: boolean; carrierCount: number } {
  try {
    const db = getDb();
    const existing = db.prepare("SELECT COUNT(*) AS c FROM carriers").get() as {
      c: number;
    };
    if (existing.c > 0) {
      return { seeded: false, carrierCount: existing.c };
    }

    const now = new Date().toISOString();
    for (const carrier of CARRIER_SEED) {
      const carrierId = newId("car");
      db.prepare(
        `INSERT INTO carriers
         (id, code, name, transport_mode, scope, is_active, adapter_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        carrierId,
        carrier.code,
        carrier.name,
        carrier.transportMode,
        carrier.scope,
        carrier.isActive ? 1 : 0,
        carrier.adapterKey,
        now,
      );

      for (const service of carrier.services) {
        const serviceId = newId("svc");
        db.prepare(
          `INSERT INTO carrier_services
           (id, carrier_id, code, name, service_class, eta_days_min, eta_days_max, supports_cod)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          serviceId,
          carrierId,
          service.code,
          service.name,
          service.serviceClass,
          service.etaDaysMin,
          service.etaDaysMax,
          service.supportsCod ? 1 : 0,
        );

        for (const rate of service.rates) {
          db.prepare(
            `INSERT INTO rate_cards
             (id, carrier_service_id, currency, base_amount, per_kg_amount, zone_label)
             VALUES (?, ?, ?, ?, ?, ?)`,
          ).run(
            newId("rate"),
            serviceId,
            rate.currency,
            rate.baseAmount,
            rate.perKgAmount,
            rate.zoneLabel,
          );
        }
      }
    }

    const after = db.prepare("SELECT COUNT(*) AS c FROM carriers").get() as {
      c: number;
    };
    return { seeded: true, carrierCount: after.c };
  } catch (error) {
    console.error(
      "[carriers.ts:seedCarriers]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Carrier seed failed.");
  }
}
