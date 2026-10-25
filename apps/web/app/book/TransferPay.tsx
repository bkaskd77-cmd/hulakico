"use client";

import { useState } from "react";

export type TransferDetails = {
  mode: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  qrImage?: string;
  configured?: boolean;
};

/**
 * Bank transfer / QR checkout while online wallets are not live: the customer pays,
 * types the bank's transaction reference, and the booking is created as
 * "awaiting payment". Ops confirms it before pickup.
 */
export function TransferPay({
  shipmentId,
  details,
  amountText,
  onReported,
  pending,
}: {
  shipmentId: string;
  details: TransferDetails;
  amountText: string;
  onReported: () => void;
  pending: boolean;
}) {
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function report() {
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/bookings/${shipmentId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not record your payment.");
      onReported();
    } catch (err) {
      console.error("[TransferPay.tsx:report]", err instanceof Error ? err.message : err);
      setError("Could not record your payment. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (!details.configured) {
    return <p className="text-sm text-[var(--muted)]">Online payment details are being set up. Please contact us to pay for this booking.</p>;
  }
  return (
    <div className="space-y-4 rounded-md border border-[color-mix(in_srgb,var(--teal)_40%,transparent)] p-4">
      <p className="text-sm font-semibold text-[var(--off-white)]">Pay {amountText} by bank transfer or QR</p>
      <div className="flex flex-wrap items-start gap-5">
        {details.qrImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded Blob image, shown as-is
          <img src={details.qrImage} alt="Hulakico payment QR code" className="h-40 w-40 rounded-md bg-white object-contain p-1" />
        ) : null}
        {details.accountNumber ? (
          <dl className="space-y-1 text-sm">
            <div><dt className="inline text-[var(--muted)]">Bank: </dt><dd className="inline text-[var(--off-white)]">{details.bankName}</dd></div>
            <div><dt className="inline text-[var(--muted)]">Account name: </dt><dd className="inline text-[var(--off-white)]">{details.accountName}</dd></div>
            <div><dt className="inline text-[var(--muted)]">Account number: </dt><dd className="inline font-semibold text-[var(--off-white)]">{details.accountNumber}</dd></div>
          </dl>
        ) : null}
      </div>
      <label className="block text-sm text-[var(--muted)]">
        Transaction reference from your bank or QR app
        <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={40} placeholder="e.g. FT26298XK1Q"
          className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]" />
      </label>
      <p className="text-xs text-[var(--muted)]">Your shipment is booked straight away. We check the payment and confirm it before pickup.</p>
      <button type="button" onClick={report} disabled={sending || pending || reference.trim().length < 4}
        className="rounded-md bg-[#ffcc00] px-4 py-2 text-sm font-semibold text-[#191919] disabled:opacity-60">
        {sending || pending ? "Booking…" : "I have paid — book my shipment"}
      </button>
      {error ? <p role="alert" className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
