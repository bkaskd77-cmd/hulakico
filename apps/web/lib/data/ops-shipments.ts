import { getDb } from "@/lib/db";

export type OpsShipmentRow = {
  id: string;
  status: string;
  lane: string;
  originCity: string;
  destinationCity: string;
  hulakicoAwb: string | null;
  externalAwb: string | null;
  partnerLabel: string | null;
  customerEmail: string;
  customerName: string;
  updatedAt: string;
  openExceptionId: string | null;
};

export type OpsShipmentFilter = "all" | "running" | "delivered" | "finished";

const FINISHED = ["DELIVERED", "CANCELLED", "RTO"] as const;

export function resolveOpsFilter(raw: string | undefined): OpsShipmentFilter {
  if (raw === "running" || raw === "delivered" || raw === "finished") return raw;
  return "all";
}

function statusWhere(filter: OpsShipmentFilter): { sql: string; params: string[] } {
  if (filter === "delivered") {
    return { sql: "s.status = ?", params: ["DELIVERED"] };
  }
  if (filter === "finished") {
    return {
      sql: `s.status IN (${FINISHED.map(() => "?").join(",")})`,
      params: [...FINISHED],
    };
  }
  if (filter === "running") {
    return {
      sql: `s.status NOT IN (${FINISHED.map(() => "?").join(",")})`,
      params: [...FINISHED],
    };
  }
  return { sql: "1=1", params: [] };
}

export type OpsShipmentCounts = {
  all: number;
  running: number;
  delivered: number;
  finished: number;
};

/** Counts for Admin shipment filter tabs. */
export function countOpsShipments(): OpsShipmentCounts {
  try {
    const db = getDb();
    const rows = db
      .prepare(`SELECT status, COUNT(*) as count FROM shipments GROUP BY status`)
      .all() as Array<{ status: string; count: number }>;
    const counts: OpsShipmentCounts = {
      all: 0,
      running: 0,
      delivered: 0,
      finished: 0,
    };
    for (const row of rows) {
      counts.all += row.count;
      if (row.status === "DELIVERED") {
        counts.delivered += row.count;
        counts.finished += row.count;
      } else if (FINISHED.includes(row.status as (typeof FINISHED)[number])) {
        counts.finished += row.count;
      } else {
        counts.running += row.count;
      }
    }
    return counts;
  } catch (error) {
    console.error(
      "[ops-shipments.ts:countOpsShipments]",
      error instanceof Error ? error.message : error,
    );
    return { all: 0, running: 0, delivered: 0, finished: 0 };
  }
}

export function listOpsShipments(
  filter: OpsShipmentFilter = "all",
): OpsShipmentRow[] {
  try {
    const where = statusWhere(filter);
    const rows = getDb()
      .prepare(
        `SELECT s.id, s.status, s.lane, s.origin_city, s.destination_city,
                s.hulakico_awb, s.external_awb, s.partner_label, s.updated_at, u.email, u.name,
                (
                  SELECT e.id FROM exception_cases e
                  WHERE e.shipment_id = s.id AND e.status = 'OPEN'
                  ORDER BY e.created_at DESC LIMIT 1
                ) as open_exception_id
         FROM shipments s
         JOIN users u ON u.id = s.user_id
         WHERE ${where.sql}
         ORDER BY s.updated_at DESC
         LIMIT 100`,
      )
      .all(...where.params) as Array<{
      id: string;
      status: string;
      lane: string;
      origin_city: string;
      destination_city: string;
      hulakico_awb: string | null;
      external_awb: string | null;
      partner_label: string | null;
      updated_at: string;
      email: string;
      name: string;
      open_exception_id: string | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      lane: row.lane,
      originCity: row.origin_city,
      destinationCity: row.destination_city,
      hulakicoAwb: row.hulakico_awb,
      externalAwb: row.external_awb,
      partnerLabel: row.partner_label,
      customerEmail: row.email,
      customerName: row.name,
      updatedAt: row.updated_at,
      openExceptionId: row.open_exception_id,
    }));
  } catch (error) {
    console.error(
      "[ops-shipments.ts:listOpsShipments]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not list ops shipments.");
  }
}
