"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SelectQuoteButton({
  shipmentId,
  quoteOptionId,
}: {
  shipmentId: string;
  quoteOptionId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/bookings/${shipmentId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteOptionId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Booking failed.");
        return;
      }
      router.push(`/book/booked/${shipmentId}`);
      router.refresh();
    } catch (err) {
      console.error("[SelectQuoteButton.tsx:onClick]", err);
      setError("Booking failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-md bg-[var(--teal)] px-3 py-1.5 text-xs font-semibold text-[var(--off-white)] disabled:opacity-60"
      >
        {pending ? "Booking…" : "Select & book"}
      </button>
      {error ? <p className="mt-1 text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
