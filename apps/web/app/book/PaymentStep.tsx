"use client";

import { useState } from "react";
import { WALLET_PROVIDERS, type WalletProviderId } from "@/lib/payments/providers";

type QuoteSummary = {
  amount: number;
  currency: string;
  quoteOptionId: string;
};

/** Payment step: COD confirm or stub Nepal wallet checkout. */
export function PaymentStep({
  shipmentId,
  wantsCod,
  lane,
  quote,
  onBookCod,
  pending,
}: {
  shipmentId: string;
  wantsCod: boolean;
  lane: "DOMESTIC" | "INTERNATIONAL";
  quote: QuoteSummary | null;
  onBookCod: () => void;
  pending: boolean;
}) {
  const [provider, setProvider] = useState<WalletProviderId>("esewa");
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const isCod = wantsCod && lane === "DOMESTIC";

  async function startWalletPay() {
    setError(null);
    setPaying(true);
    try {
      const res = await fetch(`/api/bookings/${shipmentId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start payment.");
        return;
      }
      window.location.href = data.checkoutUrl as string;
    } catch (err) {
      console.error(
        "[PaymentStep.tsx:startWalletPay]",
        err instanceof Error ? err.message : err,
      );
      setError("Could not start payment. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--teal)]">Amount due</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
          {quote
            ? `${quote.currency} ${quote.amount.toFixed(2)}`
            : "Quote unavailable"}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Freight from the top-ranked carrier option. Live wallet APIs come later.
        </p>
      </div>

      {isCod ? (
        <div className="rounded-md border border-[var(--gold)]/40 bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] p-4">
          <p className="text-sm font-semibold text-[var(--gold)]">Cash on delivery</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            No prepay required. The receiver pays on delivery. You can book now.
          </p>
          <button
            type="button"
            onClick={onBookCod}
            disabled={pending || !quote}
            className="mt-4 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)] disabled:opacity-60"
          >
            {pending ? "Booking…" : "Book the shipment"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-[var(--teal)]">Pay with</p>
          <ul className="space-y-2">
            {WALLET_PROVIDERS.map((item) => (
              <li key={item.id}>
                <label className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 ${
                  provider === item.id
                    ? "border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_14%,transparent)]"
                    : "border-[color-mix(in_srgb,var(--off-white)_14%,transparent)]"
                }`}>
                  <input
                    type="radio"
                    name="payProvider"
                    checked={provider === item.id}
                    onChange={() => setProvider(item.id)}
                    className="accent-[var(--gold)]"
                  />
                  <span className="text-sm font-semibold text-[var(--off-white)]">{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={startWalletPay}
            disabled={paying || pending || !quote}
            className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)] disabled:opacity-60"
          >
            {paying ? "Starting…" : `Continue to ${WALLET_PROVIDERS.find((p) => p.id === provider)?.label}`}
          </button>
        </div>
      )}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
