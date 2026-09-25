"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentStep } from "@/app/book/PaymentStep";
import {
  confirmBookingWithQuote,
  prepareQuotesForPayment,
} from "@/app/book/post-draft";

/** Draft-page book gate: COD book, wallet stub pay, or confirm after pay=paid. */
export function DraftBookControls({
  shipmentId,
  wantsCod,
  lane,
}: {
  shipmentId: string;
  wantsCod: boolean;
  lane: "DOMESTIC" | "INTERNATIONAL";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pay = searchParams.get("pay");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [quote, setQuote] = useState<{
    amount: number;
    currency: string;
    quoteOptionId: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prepared = await prepareQuotesForPayment(shipmentId);
      if (cancelled) return;
      if ("error" in prepared) {
        setError(prepared.error);
        return;
      }
      setQuote(prepared);
    })();
    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  useEffect(() => {
    if (pay !== "paid" || !quote) return;
    let cancelled = false;
    (async () => {
      setPending(true);
      const booked = await confirmBookingWithQuote(shipmentId, quote.quoteOptionId);
      if (cancelled) return;
      setPending(false);
      if ("error" in booked) {
        setError(booked.error);
        return;
      }
      router.replace(`/book/booked/${shipmentId}`);
      router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [pay, quote, shipmentId, router]);

  async function bookCod() {
    if (!quote) return;
    setError(null);
    setPending(true);
    const booked = await confirmBookingWithQuote(shipmentId, quote.quoteOptionId);
    setPending(false);
    if ("error" in booked) {
      setError(booked.error);
      return;
    }
    router.push(`/book/booked/${shipmentId}`);
    router.refresh();
  }

  return (
    <div className="mt-6">
      {pay === "cancel" ? (
        <p className="mb-3 text-sm text-[var(--danger)]">
          Payment cancelled. Choose a method to try again.
        </p>
      ) : null}
      {pay === "paid" && pending ? (
        <p className="text-sm text-[var(--muted)]">
          Payment received — confirming booking…
        </p>
      ) : pay === "paid" ? null : (
        <PaymentStep
          shipmentId={shipmentId}
          wantsCod={wantsCod}
          lane={lane}
          quote={quote}
          onBookCod={bookCod}
          pending={pending}
        />
      )}
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
