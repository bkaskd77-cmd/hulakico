"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { quoteAndConfirmBooking } from "./post-draft";

export function BookShipmentButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const result = await quoteAndConfirmBooking(shipmentId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/book/booked/${shipmentId}`);
      router.refresh();
    } catch (err) {
      console.error(
        "[RequestQuotesButton.tsx:BookShipmentButton.onClick]",
        err instanceof Error ? err.message : err,
      );
      setError("Booking failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)] disabled:opacity-60"
      >
        {pending ? "Booking…" : "Book the shipment"}
      </button>
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
