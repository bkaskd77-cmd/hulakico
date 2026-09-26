import { getSql } from "@/lib/sql";
import {
  HUB_STATUS_FILTERS,
  resolveHubFilter,
  retentionWhere,
  shipmentHubWhere,
  type HubFilterKey,
} from "@/lib/data/my-shipments-filters";
import { purgeExpiredFinishedShipments } from "@/lib/data/shipment-purge";
import { getSettleSummary, settleShortLabel } from "@/lib/data/settle";

export const SHIPMENTS_PAGE_SIZE = 15;
export const SHIPMENTS_MAX_PAGE_BUTTONS = 10;
export { HUB_STATUS_FILTERS, type HubFilterKey } from "@/lib/data/my-shipments-filters";

export type MyShipmentListFilters = { filter?: HubFilterKey; q?: string };

export type MyShipmentRow = {
  id: string;
  status: string;
  lane: string;
  serviceClass: string;
  packageType: string;
  contents: string;
  originCity: string;
  destinationCity: string;
  originContactName: string | null;
  destinationContactName: string | null;
  originCountry: string;
  destinationCountry: string;
  hulakicoAwb: string | null;
  trackingToken: string | null;
  settleShort: string;
  updatedAt: string;
  createdAt: string;
};

export type MyShipmentsPage = {
  rows: MyShipmentRow[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  filter: HubFilterKey;
  q: string;
  filterCounts: Record<HubFilterKey, number>;
};

export async function listMyShipments(
  userId: string,
  page = 1,
  filters: MyShipmentListFilters = {},
): Promise<MyShipmentsPage> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const filter = resolveHubFilter(filters.filter);
  const q = (filters.q ?? "").trim();
  const emptyCounts = Object.fromEntries(
    HUB_STATUS_FILTERS.map((item) => [item.key, 0]),
  ) as Record<HubFilterKey, number>;
  const empty: MyShipmentsPage = {
    rows: [], page: safePage, pageSize: SHIPMENTS_PAGE_SIZE, total: 0, pageCount: 1,
    filter, q, filterCounts: emptyCounts,
  };
  try {
    await purgeExpiredFinishedShipments();
    const db = await getSql();
    const filterCounts = { ...emptyCounts };
    const retention = retentionWhere();
    const statusRows = (await db
      .prepare(`SELECT status, COUNT(*) as count FROM shipments WHERE ${retention.sql} GROUP BY status`)
      .all(userId, ...retention.params)) as Array<{ status: string; count: number }>;
    let allCount = 0;
    for (const row of statusRows) {
      allCount += row.count;
      for (const group of HUB_STATUS_FILTERS) {
        const statuses = group.statuses as readonly string[] | null;
        if (statuses?.includes(row.status)) filterCounts[group.key] += row.count;
      }
    }
    filterCounts.all = allCount;

    const where = shipmentHubWhere(filter, q);
    const total = Number(
      ((await db.prepare(`SELECT COUNT(*) as count FROM shipments WHERE ${where.sql}`)
        .get(userId, ...where.params)) as { count: number }).count ?? 0,
    );
    const pageCount = Math.max(1, Math.ceil(total / SHIPMENTS_PAGE_SIZE));
    const pageClamped = Math.min(safePage, pageCount);
    const offset = (pageClamped - 1) * SHIPMENTS_PAGE_SIZE;
    const rows = (await db
      .prepare(
        `SELECT id, status, lane, service_class, package_type, contents,
                origin_city, destination_city, origin_country, destination_country,
                origin_contact_name, destination_contact_name,
                hulakico_awb, tracking_token, updated_at, created_at
         FROM shipments WHERE ${where.sql}
         ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      )
      .all(userId, ...where.params, SHIPMENTS_PAGE_SIZE, offset)) as Array<{
      id: string; status: string; lane: string; service_class: string; package_type: string;
      contents: string; origin_city: string; destination_city: string; origin_country: string;
      destination_country: string; origin_contact_name: string | null;
      destination_contact_name: string | null; hulakico_awb: string | null;
      tracking_token: string | null; updated_at: string; created_at: string;
    }>;

    const mapped: MyShipmentRow[] = [];
    for (const row of rows) {
      mapped.push({
        id: row.id, status: row.status, lane: row.lane, serviceClass: row.service_class,
        packageType: row.package_type, contents: row.contents, originCity: row.origin_city,
        destinationCity: row.destination_city, originCountry: row.origin_country,
        destinationCountry: row.destination_country, originContactName: row.origin_contact_name,
        destinationContactName: row.destination_contact_name, hulakicoAwb: row.hulakico_awb,
        trackingToken: row.tracking_token,
        settleShort: settleShortLabel(await getSettleSummary(row.id)),
        updatedAt: row.updated_at, createdAt: row.created_at,
      });
    }

    return {
      rows: mapped,
      page: pageClamped, pageSize: SHIPMENTS_PAGE_SIZE, total, pageCount, filter, q, filterCounts,
    };
  } catch (error) {
    console.error("[my-shipments.ts:listMyShipments]", error instanceof Error ? error.message : error);
    return empty;
  }
}
