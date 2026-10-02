import { newId } from "@/lib/domain/auth";
import { getSql } from "@/lib/sql";

const SCOPES = new Set(["DOMESTIC", "INTERNATIONAL", "BOTH"]);

function codeFromName(name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 20);
  return base.length >= 2 ? base : "CARRIER";
}

export async function insertCarrier(input: {
  name: string;
  scope: string;
}): Promise<{ ok: true } | { error: string }> {
  try {
    const name = input.name.trim().replace(/\s+/g, " ");
    const scope = input.scope.trim().toUpperCase();
    if (name.length < 2 || name.length > 80) return { error: "Enter a carrier name." };
    if (!SCOPES.has(scope)) return { error: "Choose National, International, or Both." };

    const db = await getSql();
    let code = codeFromName(name);
    const taken = await db.prepare("SELECT id FROM carriers WHERE code = ?").get(code);
    if (taken) code = `${code.slice(0, 14)}_${newId("x").slice(-4).toUpperCase()}`;

    const carrierId = newId("car");
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO carriers
         (id, code, name, transport_mode, scope, is_active, adapter_key, created_at)
         VALUES (?, ?, ?, 'THIRD_PARTY', ?, 1, 'stub_manual', ?)`,
      )
      .run(carrierId, code, name, scope, now);

    const cod = scope === "DOMESTIC" ? 1 : 0;
    const services = [
      { suffix: "EXPRESS", label: "Express", min: 2, max: 5 },
      { suffix: "ECONOMY", label: "Standard", min: 4, max: 8 },
    ];
    for (const service of services) {
      await db
        .prepare(
          `INSERT INTO carrier_services
           (id, carrier_id, code, name, service_class, eta_days_min, eta_days_max, supports_cod)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          newId("svc"),
          carrierId,
          `${code}_${service.suffix}`,
          `${name} ${service.label}`,
          service.suffix,
          service.min,
          service.max,
          cod,
        );
    }
    return { ok: true };
  } catch (error) {
    console.error("[carrier-admin.ts:insertCarrier]", error instanceof Error ? error.message : error);
    return { error: "Could not add the carrier." };
  }
}

/** Adds Express or Standard on an existing carrier, and opens the other lane when used. */
export async function ensureCarrierService(input: {
  carrierId: string;
  serviceClass: string;
  lane: string;
}): Promise<{ serviceId: string } | { error: string }> {
  try {
    const carrierId = input.carrierId.trim();
    const serviceClass = input.serviceClass.trim().toUpperCase();
    const lane = input.lane.trim().toUpperCase();
    if (!carrierId || (serviceClass !== "EXPRESS" && serviceClass !== "ECONOMY")) {
      return { error: "Choose Express or Standard." };
    }
    if (lane !== "DOMESTIC" && lane !== "INTERNATIONAL") {
      return { error: "Choose National or International." };
    }
    const db = await getSql();
    const carrier = (await db
      .prepare("SELECT id, code, name, scope FROM carriers WHERE id = ?")
      .get(carrierId)) as { id: string; code: string; name: string; scope: string } | undefined;
    if (!carrier) return { error: "Carrier not found." };
    if (carrier.scope !== "BOTH" && carrier.scope !== lane) {
      await db.prepare("UPDATE carriers SET scope = 'BOTH' WHERE id = ?").run(carrierId);
    }
    const existing = (await db
      .prepare("SELECT id FROM carrier_services WHERE carrier_id = ? AND service_class = ?")
      .get(carrierId, serviceClass)) as { id: string } | undefined;
    if (existing) return { serviceId: existing.id };
    const express = serviceClass === "EXPRESS";
    const serviceId = newId("svc");
    await db
      .prepare(
        `INSERT INTO carrier_services
         (id, carrier_id, code, name, service_class, eta_days_min, eta_days_max, supports_cod)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      )
      .run(
        serviceId,
        carrierId,
        `${carrier.code}_${serviceClass}`,
        `${carrier.name} ${express ? "Express" : "Standard"}`,
        serviceClass,
        express ? 2 : 4,
        express ? 5 : 8,
      );
    return { serviceId };
  } catch (error) {
    console.error("[carrier-admin.ts:ensureCarrierService]", error instanceof Error ? error.message : error);
    return { error: "Could not prepare that Express or Standard price list." };
  }
}
