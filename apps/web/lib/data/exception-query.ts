import { getDb } from "@/lib/db";
import type { ExceptionCaseRow } from "@/lib/data/exceptions";

export function listExceptions(
  status: "OPEN" | "INFO_REQUIRED" | "ACTIVE" | "RESOLVED" | "ALL" = "ACTIVE",
): ExceptionCaseRow[] {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT e.id, e.shipment_id, e.status, e.reason, e.previous_status,
                e.resolution_note, e.info_request_note, e.customer_reply,
                e.created_at, e.resolved_at,
                s.hulakico_awb, s.origin_city, s.destination_city
         FROM exception_cases e
         JOIN shipments s ON s.id = e.shipment_id
         WHERE (
           ? = 'ALL'
           OR (? = 'ACTIVE' AND e.status IN ('OPEN', 'INFO_REQUIRED'))
           OR e.status = ?
         )
         ORDER BY e.created_at DESC
         LIMIT 100`,
      )
      .all(status, status, status) as Array<{
      id: string;
      shipment_id: string;
      status: "OPEN" | "INFO_REQUIRED" | "RESOLVED";
      reason: string;
      previous_status: string;
      resolution_note: string | null;
      info_request_note: string | null;
      customer_reply: string | null;
      created_at: string;
      resolved_at: string | null;
      hulakico_awb: string | null;
      origin_city: string;
      destination_city: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      shipmentId: row.shipment_id,
      status: row.status,
      reason: row.reason,
      previousStatus: row.previous_status,
      resolutionNote: row.resolution_note,
      infoRequestNote: row.info_request_note,
      customerReply: row.customer_reply,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      hulakicoAwb: row.hulakico_awb,
      route: `${row.origin_city} → ${row.destination_city}`,
    }));
  } catch (error) {
    console.error(
      "[exception-query.ts:listExceptions]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not list exceptions.");
  }
}
