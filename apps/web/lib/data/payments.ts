import { getDb } from "@/lib/db";

export type PaymentIntent = {
  id: string;
  shipmentId: string;
  provider: string;
  method: "TRANSFER" | "CARD";
  status: "AWAITING_PAYMENT" | "PAID" | "CANCELLED";
  amount: number;
  currency: string;
  instructions: string;
  createdAt: string;
};

export function ensurePaymentsTable(): void {
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

export function mapPaymentRow(row: {
  id: string; shipment_id: string; provider: string; method: string;
  status: string; amount: number; currency: string; instructions: string;
  created_at: string;
}): PaymentIntent {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    provider: row.provider,
    method: row.method as "TRANSFER" | "CARD",
    status: row.status as PaymentIntent["status"],
    amount: row.amount,
    currency: row.currency,
    instructions: row.instructions,
    createdAt: row.created_at,
  };
}

/** Freight amount from selected quote, else cheapest option on latest quote. */
export function quoteAmount(
  shipmentId: string,
): { amount: number; currency: string; quoteOptionId: string | null } | null {
  try {
    const db = getDb();
    const selected = db
      .prepare(
        `SELECT qo.id, qo.amount, s.currency FROM shipments s
         JOIN quote_options qo ON qo.id = s.selected_quote_option_id
         WHERE s.id = ?`,
      )
      .get(shipmentId) as
      | { id: string; amount: number; currency: string }
      | undefined;
    if (selected?.amount > 0) {
      return {
        amount: selected.amount,
        currency: selected.currency,
        quoteOptionId: selected.id,
      };
    }
    const top = db
      .prepare(
        `SELECT qo.id, qo.amount, qo.currency FROM quote_options qo
         JOIN quotes q ON q.id = qo.quote_id
         WHERE q.shipment_id = ?
         ORDER BY q.created_at DESC, qo.amount ASC LIMIT 1`,
      )
      .get(shipmentId) as
      | { id: string; amount: number; currency: string }
      | undefined;
    if (!top || !(top.amount > 0)) return null;
    return {
      amount: top.amount,
      currency: top.currency,
      quoteOptionId: top.id,
    };
  } catch (error) {
    console.error(
      "[payments.ts:quoteAmount]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export function getPaymentIntent(intentId: string): PaymentIntent | null {
  try {
    ensurePaymentsTable();
    const row = getDb()
      .prepare(
        `SELECT id, shipment_id, provider, method, status, amount, currency, instructions, created_at
         FROM payment_intents WHERE id = ?`,
      )
      .get(intentId) as Parameters<typeof mapPaymentRow>[0] | undefined;
    return row ? mapPaymentRow(row) : null;
  } catch (error) {
    console.error(
      "[payments.ts:getPaymentIntent]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
