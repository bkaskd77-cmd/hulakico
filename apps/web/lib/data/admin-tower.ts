import { assessEtaRiskBatch } from "@/lib/data/intelligence-batch";
import { loadRouteRecords, recordFor } from "@/lib/data/route-performance";
import { toRiskItem, towerSql, type TowerSqlRow } from "@/lib/data/tower-features";
import { getSql } from "@/lib/sql";

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

/** Instant local ETA — never blocks Admin on the Python service. */
function localEta(row: {
  status: string;
  lane: string;
  service_class: string;
  onHold: boolean;
}): Pick<AdminTowerRow, "etaLevel" | "etaScore" | "etaFactors"> {
  if (row.status === "EXCEPTION" || row.onHold) {
    return {
      etaLevel: "HIGH",
      etaScore: 0.82,
      etaFactors: ["Hold / exception pressure"],
    };
  }
  if (row.lane === "INTERNATIONAL") {
    return {
      etaLevel: "MEDIUM",
      etaScore: 0.48,
      etaFactors: ["International lane", row.service_class],
    };
  }
  return {
    etaLevel: "LOW",
    etaScore: 0.22,
    etaFactors: ["Domestic lane"],
  };
}

/** Active shipments ranked by urgency, scored by the intelligence service with a local fallback. */
export async function listAdminTowerShipments(): Promise<AdminTowerRow[]> {
  try {
    const placeholders = ACTIVE.map(() => "?").join(",");
    const [rows, records] = await Promise.all([
      (await getSql()).prepare(towerSql(placeholders)).all(...ACTIVE) as Promise<TowerSqlRow[]>,
      loadRouteRecords(),
    ]);

    const now = Date.now();
    const remote = await assessEtaRiskBatch(
      rows.map((row) => toRiskItem(row, now, recordFor(records, row.lane, row.destination_city, row.carrier_id))),
    );
    const scored = new Map(remote.map((result) => [result.id, result]));

    const tower = rows.map((row) => {
      const onHold =
        row.status === "EXCEPTION" ||
        Number(row.open_exceptions) > 0 ||
        row.latest_track_status === "HOLD";
      const payPending = Number(row.pay_pending) === 1;
      const live = scored.get(row.id);
      const eta = live
        ? { etaLevel: live.level, etaScore: live.score, etaFactors: live.factors }
        : localEta({ status: row.status, lane: row.lane, service_class: row.service_class, onHold });
      let urgency = eta.etaScore;
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
        etaLevel: eta.etaLevel,
        etaScore: eta.etaScore,
        etaFactors: eta.etaFactors,
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
    throw new Error("Could not load the Admin dashboard.");
  }
}
