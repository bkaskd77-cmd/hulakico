import { getDb } from "@/lib/db";

export type AttentionItem = {
  shipmentId: string;
  kind: "HOLD" | "INFO" | "PAY";
  title: string;
  detail: string;
  href: string;
  routeLabel: string;
  awb: string | null;
};

/** Shipments that need customer action: Hold, info request, or unpaid transfer. */
export function listAttentionItems(userId: string): AttentionItem[] {
  try {
    const db = getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        id TEXT PRIMARY KEY,
        shipment_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        method TEXT NOT NULL CHECK (method IN ('TRANSFER', 'CARD')),
        status TEXT NOT NULL CHECK (status IN ('AWAITING_PAYMENT', 'PAID', 'CANCELLED')),
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        instructions TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (shipment_id) REFERENCES shipments(id)
      );
    `);
    const items: AttentionItem[] = [];

    const holds = db
      .prepare(
        `SELECT s.id, s.hulakico_awb, s.origin_city, s.destination_city, s.tracking_token,
                e.status as ex_status, e.reason, e.info_request_note
         FROM exception_cases e
         JOIN shipments s ON s.id = e.shipment_id
         WHERE s.user_id = ? AND e.status IN ('OPEN', 'INFO_REQUIRED')
         ORDER BY e.created_at DESC LIMIT 8`,
      )
      .all(userId) as Array<{
      id: string;
      hulakico_awb: string | null;
      origin_city: string;
      destination_city: string;
      tracking_token: string | null;
      ex_status: string;
      reason: string | null;
      info_request_note: string | null;
    }>;

    for (const row of holds) {
      const href = row.tracking_token
        ? `/track/${row.tracking_token}`
        : `/account/shipments/${row.id}`;
      const isInfo = row.ex_status === "INFO_REQUIRED";
      items.push({
        shipmentId: row.id,
        kind: isInfo ? "INFO" : "HOLD",
        title: isInfo ? "Info requested" : "On hold",
        detail:
          (isInfo ? row.info_request_note : row.reason)?.trim() ||
          "Hulakico needs your help to move this shipment.",
        href,
        routeLabel: `${row.origin_city} → ${row.destination_city}`,
        awb: row.hulakico_awb,
      });
    }

    const unpaid = db
      .prepare(
        `SELECT s.id, s.hulakico_awb, s.origin_city, s.destination_city,
                p.amount, p.currency
         FROM payment_intents p
         JOIN shipments s ON s.id = p.shipment_id
         WHERE s.user_id = ? AND p.status = 'AWAITING_PAYMENT' AND p.method = 'TRANSFER'
         ORDER BY p.created_at DESC LIMIT 8`,
      )
      .all(userId) as Array<{
      id: string;
      hulakico_awb: string | null;
      origin_city: string;
      destination_city: string;
      amount: number;
      currency: string;
    }>;

    const seen = new Set(items.map((item) => item.shipmentId));
    for (const row of unpaid) {
      if (seen.has(row.id)) continue;
      items.push({
        shipmentId: row.id,
        kind: "PAY",
        title: "Payment pending",
        detail: `Transfer ${row.currency} ${row.amount.toFixed(2)} to complete settle.`,
        href: `/account/shipments/${row.id}`,
        routeLabel: `${row.origin_city} → ${row.destination_city}`,
        awb: row.hulakico_awb,
      });
    }

    return items.slice(0, 8);
  } catch (error) {
    console.error(
      "[shipment-attention.ts:listAttentionItems]",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
