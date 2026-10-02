"use client";

import Link from "next/link";
import { useState } from "react";
import { HomeQuoteFields, type QuoteSpecPayload } from "@/app/home/HomeQuoteFields";
import { useQuoteReveal } from "@/app/home/use-quote-reveal";

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

export function HomeQuoteForm({ bookHref }: { bookHref: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<RankedOption[]>([]);
  useQuoteReveal(setOpen);

  function dismiss() {
    setOpen(false);
    setError(null);
    setOptions([]);
  }

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
      console.error("[HomeQuoteForm.tsx:requestQuote]", err);
      setError("Could not get quotes. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,#1a4d6e_55%,transparent)] px-4 py-10 backdrop-blur-sm"
      onClick={dismiss}
      role="presentation"
    >
      <section
        className="relative w-full max-w-4xl rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">AI quote</p>
            <h2 id="quote-title" className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[var(--off-white)]">
              Get the quote
            </h2>
          </div>
          <button type="button" onClick={dismiss} className="text-sm text-[var(--muted)] hover:text-[var(--off-white)]">
            Close
          </button>
        </div>
        <HomeQuoteFields pending={pending} onSubmit={requestQuote} />
        {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
        {options.length > 0 ? (
          <div className="mt-8 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-6">
            <p className="text-sm leading-relaxed text-[var(--off-white)]/85">
              This quoted price is tentative. It is not a live partner rate, and it can change at booking if the measured weight or dimensions differ from what you entered.
            </p>
            <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-4">
              <div>
                <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">
                  {options[0].serviceName}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  ETA {options[0].etaDaysMin}–{options[0].etaDaysMax}d
                </p>
              </div>
              <p className="text-sm font-semibold text-[var(--gold)]">{options[0].currency} {options[0].amount.toFixed(2)}</p>
            </div>
            <Link href={bookHref} onClick={dismiss} className="mt-8 inline-flex rounded-md bg-[var(--teal)] px-6 py-3 text-sm font-semibold text-[var(--off-white)]">
              Book with these details
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
