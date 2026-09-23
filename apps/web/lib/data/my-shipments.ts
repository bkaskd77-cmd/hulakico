import { getDb } from "@/lib/db";
import {
  finishedStatuses,
  purgeExpiredFinishedShipments,
  retentionCutoffIso,
} from "@/lib/data/shipment-purge";

/** Customer hub: fixed page size; UI shows at most page buttons 1–10. */
export const SHIPMENTS_PAGE_SIZE = 15;
export const SHIPMENTS_MAX_PAGE_BUTTONS = 10;

export type MyShipmentRow = {
  id: string;
  status: string;
  lane: string;
  originCity: string;
  destinationCity: string;
  hulakicoAwb: string | null;
  trackingToken: string | null;
  updatedAt: string;
  createdAt: string;
};

export type MyShipmentsPage = {
  rows: MyShipmentRow[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export function listMyShipments(userId: string, page = 1): MyShipmentsPage {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const empty: MyShipmentsPage = {
    rows: [],
    page: safePage,
    pageSize: SHIPMENTS_PAGE_SIZE,
    total: 0,
    pageCount: 1,
  };
  try {
    purgeExpiredFinishedShipments();
    const db = getDb();
    const cutoff = retentionCutoffIso();
    const finished = finishedStatuses();
    const marks = finished.map(() => "?").join(", ");
    const where = `user_id = ? AND (status NOT IN (${marks}) OR updated_at >= ?)`;
    const total = Number(
      (db.prepare(`SELECT COUNT(*) as count FROM shipments WHERE ${where}`)
        .get(userId, ...finished, cutoff) as { count: number }).count ?? 0,
    );
    const pageCount = Math.max(1, Math.ceil(total / SHIPMENTS_PAGE_SIZE));
    const pageClamped = Math.min(safePage, pageCount);
    const offset = (pageClamped - 1) * SHIPMENTS_PAGE_SIZE;
    const rows = db
      .prepare(
        `SELECT id, status, lane, origin_city, destination_city,
                hulakico_awb, tracking_token, updated_at, created_at
         FROM shipments WHERE ${where}
         ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      )
      .all(userId, ...finished, cutoff, SHIPMENTS_PAGE_SIZE, offset) as Array<{
      id: string;
      status: string;
      lane: string;
      origin_city: string;
      destination_city: string;
      hulakico_awb: string | null;
      tracking_token: string | null;
      updated_at: string;
      created_at: string;
    }>;

    return {
      rows: rows.map((row) => ({
        id: row.id,
        status: row.status,
        lane: row.lane,
        originCity: row.origin_city,
        destinationCity: row.destination_city,
        hulakicoAwb: row.hulakico_awb,
        trackingToken: row.tracking_token,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
      })),
      page: pageClamped,
      pageSize: SHIPMENTS_PAGE_SIZE,
      total,
      pageCount,
    };
  } catch (error) {
    console.error(
      "[my-shipments.ts:listMyShipments]",
      error instanceof Error ? error.message : error,
    );
    return empty;
  }
}
