"use client";

import Link from "next/link";
import { useState } from "react";
import { HomeQuoteFields, type QuoteSpecPayload } from "@/app/home/HomeQuoteFields";

type RankedOption = {
  id: string;
  carrierName: string;
  serviceName: string;
  currency: string;
  amount: number;
  etaDaysMin: number;
  etaDaysMax: number;
  rank: number;
  rankScore?: number;
  rankReason?: string;
};

/** Inline Quote tab — AI rank reveal with stagger motion. */
export function HomeQuoteInline({ bookHref }: { bookHref: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<RankedOption[]>([]);

  async function requestQuote(payload: QuoteSpecPayload) {
    setError(null);
    setPending(true);
    setOptions([]);
    try {
      if (!payload.origin.line1.trim() || !payload.destination.line1.trim()) {
        setError("From and To addresses are required.");
        return;
      }
      const response = await fetch("/api/quotes/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originCountry: payload.origin.country,
          originCity: payload.origin.city,
          originLine1: payload.origin.line1,
          originPostalCode: payload.origin.postalCode,
          destinationCountry: payload.destination.country,
          destinationCity: payload.destination.city,
          destinationLine1: payload.destination.line1,
          destinationPostalCode: payload.destination.postalCode,
          weightKg: payload.weightKg,
          lengthCm: payload.lengthCm,
          widthCm: payload.widthCm,
          heightCm: payload.heightCm,
          serviceClass: payload.serviceClass,
          packageType: payload.packageType,
          contents: payload.contents,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not get quotes.");
        return;
      }
      setOptions(data.options as RankedOption[]);
    } catch (err) {
      console.error("[HomeQuoteInline.tsx:requestQuote]", err);
      setError("Could not get quotes. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">AI quote</p>
      <p className="mt-2 text-sm text-[var(--muted)]">Estimate cost for this route.</p>
      <div className="mt-4 max-h-[min(52vh,28rem)] overflow-y-auto pr-1">
        <HomeQuoteFields pending={pending} onSubmit={requestQuote} />
      </div>
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      {options.length > 0 ? (
        <div className="mt-5 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-4">
          <p className="text-sm leading-relaxed text-[var(--off-white)]/85">
            This quoted price is tentative. It is not a live partner rate, and it can change at booking if the measured weight or dimensions differ from what you entered.
          </p>
          <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] pt-3">
            <div>
              <p className="font-[family-name:var(--font-display)] font-bold text-[var(--off-white)]">
                {options[0].serviceName}
              </p>
              <p className="text-xs text-[var(--muted)]">
                ETA {options[0].etaDaysMin}–{options[0].etaDaysMax}d
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--gold)]">
              {options[0].currency} {options[0].amount.toFixed(2)}
            </p>
          </div>
          <Link
            href={bookHref}
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-[var(--teal)] px-4 py-3 text-sm font-semibold text-[var(--off-white)]"
          >
            Book with these details
          </Link>
        </div>
      ) : null}
    </div>
  );
}
