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

/** Active shipments ranked by urgency — SQLite only, no remote wait. */
export async function listAdminTowerShipments(): Promise<AdminTowerRow[]> {
  try {
    const placeholders = ACTIVE.map(() => "?").join(",");
    const rows = (await (await getSql())
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
      .all(...ACTIVE)) as Array<{
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

    const tower = rows.map((row) => {
      const onHold =
        row.status === "EXCEPTION" ||
        Boolean(row.open_exception_id) ||
        row.latest_track_status === "HOLD";
      const payPending = row.pay_pending === 1;
      const eta = localEta({
        status: row.status,
        lane: row.lane,
        service_class: row.service_class,
        onHold,
      });
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
    throw new Error("Could not load Admin control tower.");
  }
}
