import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";
import {
  ensurePaymentsTable,
  mapPaymentRow,
  quoteAmount,
  type PaymentIntent,
} from "@/lib/data/payments";
import { payProviderMode } from "@/lib/payments/providers";

function latestOpenIntent(shipmentId: string): PaymentIntent | null {
  const row = getDb()
    .prepare(
      `SELECT id, shipment_id, provider, method, status, amount, currency, instructions, created_at
       FROM payment_intents WHERE shipment_id = ? AND status != 'CANCELLED'
       ORDER BY created_at DESC LIMIT 1`,
    )
    .get(shipmentId) as Parameters<typeof mapPaymentRow>[0] | undefined;
  return row ? mapPaymentRow(row) : null;
}

/** Stub bank-transfer intent for non-COD booked freight (legacy settle path). */
export function ensureTransferPaymentIntent(
  shipmentId: string,
): PaymentIntent | null {
  try {
    if (payProviderMode() === "off") return null;
    ensurePaymentsTable();
    const existing = latestOpenIntent(shipmentId);
    if (existing) return existing;

    const quote = quoteAmount(shipmentId);
    if (!quote) return null;
    const id = newId("pay");
    const now = new Date().toISOString();
    const ref = shipmentId.slice(-8).toUpperCase();
    const instructions =
      `Stub bank transfer: pay ${quote.currency} ${quote.amount.toFixed(2)} ` +
      `to Hulakico Ops (A/C 0123456789 / Nepal Bank). Reference ${ref}.`;

    getDb()
      .prepare(
        `INSERT INTO payment_intents
         (id, shipment_id, provider, method, status, amount, currency, instructions, created_at)
         VALUES (?, ?, 'stub', 'TRANSFER', 'AWAITING_PAYMENT', ?, ?, ?, ?)`,
      )
      .run(id, shipmentId, quote.amount, quote.currency, instructions, now);

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
      "[payment-transfer.ts:ensureTransferPaymentIntent]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
