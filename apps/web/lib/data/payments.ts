import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";

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

function payProviderMode(): "stub" | "off" {
  const mode = (process.env.PAY_PROVIDER || "stub").trim().toLowerCase();
  return mode === "off" ? "off" : "stub";
}

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

function quoteAmount(shipmentId: string): { amount: number; currency: string } | null {
  const row = getDb()
    .prepare(
      `SELECT qo.amount, s.currency FROM shipments s
       LEFT JOIN quote_options qo ON qo.id = s.selected_quote_option_id
       WHERE s.id = ?`,
    )
    .get(shipmentId) as { amount: number | null; currency: string } | undefined;
  if (!row || row.amount == null || !(row.amount > 0)) return null;
  return { amount: row.amount, currency: row.currency };
}

/** Stub bank-transfer intent for non-COD booked freight (no live card yet). */
export function ensureTransferPaymentIntent(
  shipmentId: string,
): PaymentIntent | null {
  try {
    if (payProviderMode() === "off") return null;
    ensurePaymentsTable();
    const db = getDb();
    const existing = db
      .prepare(
        `SELECT id, shipment_id, provider, method, status, amount, currency, instructions, created_at
         FROM payment_intents WHERE shipment_id = ? AND status != 'CANCELLED'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(shipmentId) as
      | {
          id: string; shipment_id: string; provider: string; method: string;
          status: string; amount: number; currency: string; instructions: string;
          created_at: string;
        }
      | undefined;
    if (existing) {
      return {
        id: existing.id,
        shipmentId: existing.shipment_id,
        provider: existing.provider,
        method: existing.method as "TRANSFER" | "CARD",
        status: existing.status as PaymentIntent["status"],
        amount: existing.amount,
        currency: existing.currency,
        instructions: existing.instructions,
        createdAt: existing.created_at,
      };
    }

    const quote = quoteAmount(shipmentId);
    if (!quote) return null;
    const id = newId("pay");
    const now = new Date().toISOString();
    const ref = shipmentId.slice(-8).toUpperCase();
    const instructions =
      `Stub bank transfer: pay ${quote.currency} ${quote.amount.toFixed(2)} ` +
      `to Hulakico Ops (A/C 0123456789 / Nepal Bank). Reference ${ref}. ` +
      `Card checkout comes later when PAY_PROVIDER is live.`;

    db.prepare(
      `INSERT INTO payment_intents
       (id, shipment_id, provider, method, status, amount, currency, instructions, created_at)
       VALUES (?, ?, 'stub', 'TRANSFER', 'AWAITING_PAYMENT', ?, ?, ?, ?)`,
    ).run(id, shipmentId, quote.amount, quote.currency, instructions, now);

    return {
      id,
      shipmentId,
      provider: "stub",
      method: "TRANSFER",
      status: "AWAITING_PAYMENT",
      amount: quote.amount,
      currency: quote.currency,
      instructions,
      createdAt: now,
    };
  } catch (error) {
    console.error(
      "[payments.ts:ensureTransferPaymentIntent]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
