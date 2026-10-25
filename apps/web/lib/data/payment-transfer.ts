import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import {
  ensurePaymentsTable,
  mapPaymentRow,
  quoteAmount,
  type PaymentIntent,
} from "@/lib/data/payments";
import { payProviderMode } from "@/lib/payments/providers";

async function latestOpenIntent(shipmentId: string): Promise<PaymentIntent | null> {
  const row = (await (await getSql())
    .prepare(
      `SELECT id, shipment_id, provider, method, status, amount, currency, instructions, created_at
       FROM payment_intents WHERE shipment_id = ? AND status != 'CANCELLED'
       ORDER BY created_at DESC LIMIT 1`,
    )
    .get(shipmentId)) as Parameters<typeof mapPaymentRow>[0] | undefined;
  return row ? mapPaymentRow(row) : null;
}

/** Stub bank-transfer intent for non-COD booked freight (legacy settle path). */
export async function ensureTransferPaymentIntent(
  shipmentId: string,
): Promise<PaymentIntent | null> {
  try {
    if (payProviderMode() === "off") return null;
    await ensurePaymentsTable();
    const existing = await latestOpenIntent(shipmentId);
    if (existing) return existing;

    const quote = await quoteAmount(shipmentId);
    if (!quote) return null;
    const id = newId("pay");
    const now = new Date().toISOString();
    const ref = shipmentId.slice(-8).toUpperCase();
    const instructions =
      `Stub bank transfer: pay ${quote.currency} ${quote.amount.toFixed(2)} ` +
      `to Hulakico Ops (A/C 0123456789 / Nepal Bank). Reference ${ref}.`;

    await (await getSql())
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

const REFERENCE_OK = /^[A-Za-z0-9][A-Za-z0-9 ._/-]{3,39}$/;

/**
 * Customer paid by bank transfer or QR and typed the bank's transaction reference.
 * Records it as AWAITING_PAYMENT for Ops to match against the bank statement.
 */
export async function recordCustomerTransfer(
  shipmentId: string,
  reference: string,
): Promise<{ intent: PaymentIntent } | { error: string }> {
  try {
    if (payProviderMode() !== "transfer") return { error: "Bank transfer is not enabled." };
    const ref = reference.replace(/\s+/g, " ").trim();
    if (!REFERENCE_OK.test(ref)) {
      return { error: "Enter the transaction reference from your bank or QR app (4–40 letters or numbers)." };
    }
    await ensurePaymentsTable();
    const quote = await quoteAmount(shipmentId);
    if (!quote) return { error: "No price yet. Go back to Review and continue again." };
    const db = await getSql();
    await db.prepare(
      `UPDATE payment_intents SET status = 'CANCELLED' WHERE shipment_id = ? AND status = 'AWAITING_PAYMENT'`,
    ).run(shipmentId);
    const id = newId("pay");
    const now = new Date().toISOString();
    const instructions = `Bank/QR transfer of ${quote.currency} ${quote.amount.toFixed(2)}. Customer reference: ${ref}`;
    await db.prepare(
      `INSERT INTO payment_intents (id, shipment_id, provider, method, status, amount, currency, instructions, created_at)
       VALUES (?, ?, 'bank', 'TRANSFER', 'AWAITING_PAYMENT', ?, ?, ?, ?)`,
    ).run(id, shipmentId, quote.amount, quote.currency, instructions, now);
    return {
      intent: { id, shipmentId, provider: "bank", method: "TRANSFER", status: "AWAITING_PAYMENT", amount: quote.amount, currency: quote.currency, instructions, createdAt: now },
    };
  } catch (error) {
    console.error("[payment-transfer.ts:recordCustomerTransfer]", error instanceof Error ? error.message : error);
    return { error: "Could not record your payment. Please try again." };
  }
}

/** Freight counts as settled for handover: COD on domestic, or a payment Ops marked PAID. */
export async function isFreightSettled(shipmentId: string): Promise<boolean> {
  try {
    const db = await getSql();
    const row = (await db.prepare(`SELECT wants_cod, lane FROM shipments WHERE id = ?`).get(shipmentId)) as
      | { wants_cod: number; lane: string }
      | undefined;
    if (!row) return false;
    if (row.wants_cod === 1 && row.lane === "DOMESTIC") return true;
    await ensurePaymentsTable();
    return Boolean(await db.prepare(`SELECT 1 FROM payment_intents WHERE shipment_id = ? AND status = 'PAID' LIMIT 1`).get(shipmentId));
  } catch (error) {
    console.error("[payment-transfer.ts:isFreightSettled]", error instanceof Error ? error.message : error);
    return false;
  }
}
