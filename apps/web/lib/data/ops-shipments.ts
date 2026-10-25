import { getSql } from "@/lib/sql";

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

export type OpsShipmentFilter = "all" | "running" | "drafts" | "delivered" | "closed";

/** Which statuses each Admin tab shows. Drafts and quotes are not live consignments. */
const GROUPS: Record<Exclude<OpsShipmentFilter, "all">, readonly string[]> = {
  running: ["BOOKED", "HANDOVER_PENDING", "IN_TRANSIT", "OUT_FOR_DELIVERY", "EXCEPTION", "HOLD"],
  drafts: ["DRAFT", "QUOTED"],
  delivered: ["DELIVERED"],
  closed: ["CANCELLED", "RTO"],
};

export function resolveOpsFilter(raw: string | undefined): OpsShipmentFilter {
  if (raw === "finished") return "closed";
  if (raw === "running" || raw === "drafts" || raw === "delivered" || raw === "closed") return raw;
  return "all";
}

function statusWhere(filter: OpsShipmentFilter): { sql: string; params: string[] } {
  if (filter === "all") return { sql: "1=1", params: [] };
  const statuses = GROUPS[filter];
  return { sql: `s.status IN (${statuses.map(() => "?").join(",")})`, params: [...statuses] };
}

/** Free-text search over AWBs, cities, and the customer's name or email. */
function searchWhere(query: string): { sql: string; params: string[] } {
  const clean = query.trim().slice(0, 60).replace(/[%_\\]/g, "");
  if (!clean) return { sql: "1=1", params: [] };
  const like = `%${clean}%`;
  return {
    sql: `(s.hulakico_awb LIKE ? OR s.external_awb LIKE ? OR s.origin_city LIKE ? OR s.destination_city LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`,
    params: [like, like, like, like, like, like],
  };
}

export type OpsShipmentCounts = Record<OpsShipmentFilter, number>;

/** Counts for Admin shipment filter tabs. */
export async function countOpsShipments(): Promise<OpsShipmentCounts> {
  const counts: OpsShipmentCounts = { all: 0, running: 0, drafts: 0, delivered: 0, closed: 0 };
  try {
    const rows = (await (await getSql())
      .prepare(`SELECT status, COUNT(*) as count FROM shipments GROUP BY status`)
      .all()) as Array<{ status: string; count: number }>;
    for (const row of rows) {
      counts.all += Number(row.count);
      for (const [key, statuses] of Object.entries(GROUPS)) {
        if (statuses.includes(row.status)) counts[key as keyof typeof GROUPS] += Number(row.count);
      }
    }
    return counts;
  } catch (error) {
    console.error("[ops-shipments.ts:countOpsShipments]", error instanceof Error ? error.message : error);
    return counts;
  }
}

export async function listOpsShipments(
  filter: OpsShipmentFilter = "all",
  query = "",
): Promise<OpsShipmentRow[]> {
  try {
    const where = statusWhere(filter);
    const search = searchWhere(query);
    const rows = (await (await getSql())
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
         WHERE ${where.sql} AND ${search.sql}
         ORDER BY s.updated_at DESC
         LIMIT 100`,
      )
      .all(...where.params, ...search.params)) as Array<{
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
