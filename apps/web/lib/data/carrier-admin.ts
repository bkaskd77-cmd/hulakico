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
