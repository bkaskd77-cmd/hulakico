import { getSql } from "@/lib/sql";

/** On-time record for one route; the intelligence service turns it into a learned rate. */
export type RouteRecord = { onTime: number; delivered: number };

type DeliveredRow = {
  lane: string;
  city: string;
  carrier_id: string | null;
  booked_at: string | null;
  delivered_at: string | null;
  eta_days_max: number | null;
};

/** A route by itself, and the same route with one partner. */
export function routeKey(lane: string, city: string, carrierId?: string | null): string {
  return [lane, city.trim().toLowerCase(), carrierId ?? ""].join("|");
}

/** Delivered within the promised days (half a day of grace for timestamps). */
function wasOnTime(row: DeliveredRow): boolean | null {
  const booked = Date.parse(row.booked_at ?? "");
  const delivered = Date.parse(row.delivered_at ?? "");
  if (Number.isNaN(booked) || Number.isNaN(delivered) || !row.eta_days_max) return null;
  return (delivered - booked) / 864e5 <= row.eta_days_max + 0.5;
}

function add(stats: Map<string, RouteRecord>, key: string, onTime: boolean): void {
  const record = stats.get(key) ?? { onTime: 0, delivered: 0 };
  record.delivered += 1;
  if (onTime) record.onTime += 1;
  stats.set(key, record);
}

/** On-time records for the last year of delivered shipments, by route and by route plus partner. */
export async function loadRouteRecords(): Promise<Map<string, RouteRecord>> {
  const stats = new Map<string, RouteRecord>();
  try {
    const rows = (await (await getSql())
      .prepare(
        `SELECT s.lane, s.destination_city as city, s.carrier_id,
                (SELECT MIN(te.occurred_at) FROM tracking_events te WHERE te.shipment_id = s.id) as booked_at,
                (SELECT MIN(te.occurred_at) FROM tracking_events te
                 WHERE te.shipment_id = s.id AND te.status = 'DELIVERED') as delivered_at,
                (SELECT qo.eta_days_max FROM quote_options qo WHERE qo.id = s.selected_quote_option_id) as eta_days_max
         FROM shipments s
         WHERE s.status = 'DELIVERED' AND s.updated_at >= ?
         ORDER BY s.updated_at DESC
         LIMIT 2000`,
      )
      .all(new Date(Date.now() - 365 * 864e5).toISOString())) as DeliveredRow[];
    for (const row of rows) {
      const onTime = wasOnTime(row);
      if (onTime === null) continue;
      add(stats, routeKey(row.lane, row.city), onTime);
      if (row.carrier_id) add(stats, routeKey(row.lane, row.city, row.carrier_id), onTime);
    }
    return stats;
  } catch (error) {
    console.error("[route-performance.ts:loadRouteRecords]", error instanceof Error ? error.message : error);
    return stats;
  }
}

/** The partner's own record on this route once it has 5 deliveries, otherwise the route's record. */
export function recordFor(
  stats: Map<string, RouteRecord>,
  lane: string,
  city: string,
  carrierId: string | null,
): RouteRecord | null {
  const withPartner = carrierId ? stats.get(routeKey(lane, city, carrierId)) : undefined;
  if (withPartner && withPartner.delivered >= 5) return withPartner;
  return stats.get(routeKey(lane, city)) ?? null;
}
