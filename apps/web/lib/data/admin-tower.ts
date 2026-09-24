import { getDb } from "@/lib/db";
import { assessEtaRiskBatch } from "@/lib/data/intelligence-batch";

export type AdminTowerRow = {
  id: string;
  status: string;
  lane: string;
  originCity: string;
  destinationCity: string;
  serviceClass: string;
  hulakicoAwb: string | null;
  customerEmail: string;
  onHold: boolean;
  payPending: boolean;
  etaLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  etaScore: number;
  etaFactors: string[];
  urgencyScore: number;
};

const ACTIVE = [
  "BOOKED",
  "HANDOVER_PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "EXCEPTION",
];

export async function listAdminTowerShipments(): Promise<AdminTowerRow[]> {
  try {
    getDb().exec(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        id TEXT PRIMARY KEY,
        shipment_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        method TEXT NOT NULL,
        status TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        instructions TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    const placeholders = ACTIVE.map(() => "?").join(",");
    const rows = getDb()
      .prepare(
        `SELECT s.id, s.status, s.lane, s.origin_city, s.destination_city,
                s.service_class, s.hulakico_awb, u.email,
                (
                  SELECT e.id FROM exception_cases e
                  WHERE e.shipment_id = s.id AND e.status = 'OPEN'
                  ORDER BY e.created_at DESC LIMIT 1
                ) as open_exception_id,
                (
                  SELECT te.status FROM tracking_events te
                  WHERE te.shipment_id = s.id
                  ORDER BY te.occurred_at DESC LIMIT 1
                ) as latest_track_status,
                EXISTS (
                  SELECT 1 FROM payment_intents p
                  WHERE p.shipment_id = s.id AND p.status = 'AWAITING_PAYMENT'
                ) as pay_pending
         FROM shipments s
         JOIN users u ON u.id = s.user_id
         WHERE s.status IN (${placeholders})
         ORDER BY s.updated_at DESC
         LIMIT 40`,
      )
      .all(...ACTIVE) as Array<{
      id: string;
      status: string;
      lane: string;
      origin_city: string;
      destination_city: string;
      service_class: string;
      hulakico_awb: string | null;
      email: string;
      open_exception_id: string | null;
      latest_track_status: string | null;
      pay_pending: number;
    }>;

    const risks = await assessEtaRiskBatch(
      rows.map((row) => ({
        id: row.id,
        lane: row.lane,
        destinationCity: row.destination_city,
        serviceClass: row.service_class,
      })),
    );
    const byId = new Map(risks.map((r) => [r.id, r]));

    const tower = rows.map((row) => {
      const risk = byId.get(row.id);
      const onHold =
        row.status === "EXCEPTION" ||
        Boolean(row.open_exception_id) ||
        row.latest_track_status === "HOLD";
      const payPending = row.pay_pending === 1;
      const etaScore = risk?.score ?? 0;
      let urgency = etaScore;
      if (onHold) urgency += 0.25;
      if (payPending) urgency += 0.15;
      urgency = Math.min(1.5, urgency);
      return {
        id: row.id,
        status: row.status,
        lane: row.lane,
        originCity: row.origin_city,
        destinationCity: row.destination_city,
        serviceClass: row.service_class,
        hulakicoAwb: row.hulakico_awb,
        customerEmail: row.email,
        onHold,
        payPending,
        etaLevel: (risk?.level ?? "UNKNOWN") as AdminTowerRow["etaLevel"],
        etaScore,
        etaFactors: risk?.factors?.slice(0, 3) ?? [],
        urgencyScore: Math.round(urgency * 1000) / 1000,
      };
    });

    tower.sort((a, b) => b.urgencyScore - a.urgencyScore);
    return tower;
  } catch (error) {
    console.error(
      "[admin-tower.ts:listAdminTowerShipments]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not load Admin control tower.");
  }
}
