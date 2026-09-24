import { getDb } from "@/lib/db";

export type AwaitingTransferPayment = {
  id: string;
  shipmentId: string;
  amount: number;
  currency: string;
  hulakicoAwb: string | null;
  route: string;
  createdAt: string;
};

function ensurePaymentsTable(): void {
  getDb().exec(`
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
}

export function listAwaitingTransferPayments(): AwaitingTransferPayment[] {
  try {
    ensurePaymentsTable();
    const rows = getDb()
      .prepare(
        `SELECT p.id, p.shipment_id, p.amount, p.currency, p.created_at,
                s.hulakico_awb, s.origin_city, s.destination_city
         FROM payment_intents p
         JOIN shipments s ON s.id = p.shipment_id
         WHERE p.status = 'AWAITING_PAYMENT' AND p.method = 'TRANSFER'
         ORDER BY p.created_at DESC`,
      )
      .all() as Array<{
      id: string;
      shipment_id: string;
      amount: number;
      currency: string;
      created_at: string;
      hulakico_awb: string | null;
      origin_city: string;
      destination_city: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      shipmentId: row.shipment_id,
      amount: row.amount,
      currency: row.currency,
      hulakicoAwb: row.hulakico_awb,
      route: `${row.origin_city} → ${row.destination_city}`,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error(
      "[payment-ops.ts:listAwaitingTransferPayments]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Failed to list awaiting transfer payments.");
  }
}

export function markTransferPaid(
  paymentId: string,
  note: string,
): { ok: true } | { error: string } {
  try {
    const trimmed = note.trim();
    if (trimmed.length < 2) {
      return { error: "Payment note is required." };
    }
    ensurePaymentsTable();
    const result = getDb()
      .prepare(
        `UPDATE payment_intents
         SET status = 'PAID',
             instructions = instructions || ' | Paid note: ' || ?
         WHERE id = ? AND status = 'AWAITING_PAYMENT'`,
      )
      .run(trimmed, paymentId);
    if (result.changes === 0) {
      return { error: "Payment not found or already settled." };
    }
    return { ok: true };
  } catch (error) {
    console.error(
      "[payment-ops.ts:markTransferPaid]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Failed to mark transfer paid." };
  }
}
