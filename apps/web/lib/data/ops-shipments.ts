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

export function listOpsShipments(): OpsShipmentRow[] {
  try {
    const db = getDb();
    const rows = db
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
         ORDER BY s.updated_at DESC
         LIMIT 100`,
      )
      .all() as Array<{
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
