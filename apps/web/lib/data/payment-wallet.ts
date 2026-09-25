import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";
import {
  ensurePaymentsTable,
  getPaymentIntent,
  quoteAmount,
  type PaymentIntent,
} from "@/lib/data/payments";
import {
  isWalletProvider,
  payProviderMode,
  resolveCheckoutUrl,
  walletLabel,
  type WalletProviderId,
} from "@/lib/payments/providers";

export function createWalletPaymentIntent(
  shipmentId: string,
  provider: WalletProviderId,
):
  | { intent: PaymentIntent; checkoutUrl: string }
  | { error: string } {
  try {
    if (payProviderMode() === "off") {
      return { error: "Payments are disabled (PAY_PROVIDER=off)." };
    }
    if (!isWalletProvider(provider)) {
      return { error: "Unknown payment provider." };
    }
    ensurePaymentsTable();
    const quote = quoteAmount(shipmentId);
    if (!quote) {
      return { error: "No quote amount available. Generate quotes first." };
    }

    const mode = payProviderMode();
    if (mode === "live") {
      const preflight = resolveCheckoutUrl("preflight", provider);
      if ("error" in preflight) return { error: preflight.error };
    }

    const db = getDb();
    db.prepare(
      `UPDATE payment_intents SET status = 'CANCELLED'
       WHERE shipment_id = ? AND status = 'AWAITING_PAYMENT'`,
    ).run(shipmentId);

    const id = newId("pay");
    const now = new Date().toISOString();
    const label = walletLabel(provider);
    const instructions =
      mode === "live"
        ? `Live ${label}: pay ${quote.currency} ${quote.amount.toFixed(2)}.`
        : `Stub ${label}: pay ${quote.currency} ${quote.amount.toFixed(2)}. ` +
          `Live ${label} keys will replace this checkout when the product goes live.`;

    const resolved = resolveCheckoutUrl(id, provider);
    if ("error" in resolved) {
      return { error: resolved.error };
    }

    db.prepare(
      `INSERT INTO payment_intents
       (id, shipment_id, provider, method, status, amount, currency, instructions, created_at)
       VALUES (?, ?, ?, 'CARD', 'AWAITING_PAYMENT', ?, ?, ?, ?)`,
    ).run(id, shipmentId, provider, quote.amount, quote.currency, instructions, now);

    const intent: PaymentIntent = {
      id,
      shipmentId,
      provider,
      method: "CARD",
      status: "AWAITING_PAYMENT",
      amount: quote.amount,
      currency: quote.currency,
      instructions,
      createdAt: now,
    };
    return { intent, checkoutUrl: resolved.checkoutUrl };
  } catch (error) {
    console.error(
      "[payment-wallet.ts:createWalletPaymentIntent]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not start payment." };
  }
}

export function markPaymentPaid(
  intentId: string,
): { ok: true; intent: PaymentIntent } | { error: string } {
  try {
    ensurePaymentsTable();
    const existing = getPaymentIntent(intentId);
    if (!existing) return { error: "Payment not found." };
    if (existing.status === "PAID") return { ok: true, intent: existing };
    if (existing.status !== "AWAITING_PAYMENT") {
      return { error: "Payment is not awaiting settlement." };
    }
    getDb()
      .prepare(
        `UPDATE payment_intents SET status = 'PAID',
         instructions = instructions || ' | Stub checkout: paid'
         WHERE id = ? AND status = 'AWAITING_PAYMENT'`,
      )
      .run(intentId);
    const intent = getPaymentIntent(intentId);
    if (!intent) return { error: "Payment not found after update." };
    return { ok: true, intent };
  } catch (error) {
    console.error(
      "[payment-wallet.ts:markPaymentPaid]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Failed to mark payment paid." };
  }
}

/** COD domestic may confirm unpaid; otherwise requires a PAID intent. */
export function canConfirmBooking(shipmentId: string): boolean {
  try {
    const row = getDb()
      .prepare(`SELECT wants_cod, lane FROM shipments WHERE id = ?`)
      .get(shipmentId) as { wants_cod: number; lane: string } | undefined;
    if (!row) return false;
    if (row.wants_cod === 1 && row.lane === "DOMESTIC") return true;
    ensurePaymentsTable();
    const paid = getDb()
      .prepare(
        `SELECT 1 FROM payment_intents
         WHERE shipment_id = ? AND status = 'PAID' LIMIT 1`,
      )
      .get(shipmentId);
    return Boolean(paid);
  } catch (error) {
    console.error(
      "[payment-wallet.ts:canConfirmBooking]",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
