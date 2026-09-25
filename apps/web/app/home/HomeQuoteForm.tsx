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
  const [rankedByAi, setRankedByAi] = useState(false);
  const [options, setOptions] = useState<RankedOption[]>([]);
  useQuoteReveal(setOpen);

  function dismiss() {
    setOpen(false);
    setError(null);
    setOptions([]);
    setRankedByAi(false);
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
      setRankedByAi(Boolean(data.rankedByAi));
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
            <p className="text-sm text-[var(--muted)]">
              {rankedByAi ? "Ranked by Hulakico AI." : "Price order (AI offline)."}
            </p>
            <ul className="mt-4 space-y-3">
              {options.map((o) => (
                <li key={o.id} className="flex flex-wrap justify-between gap-3 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-4">
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">
                      #{o.rank} {o.carrierName}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {o.serviceName} · ETA {o.etaDaysMin}–{o.etaDaysMax}d
                      {o.rankReason ? ` · ${o.rankReason}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--gold)]">{o.currency} {o.amount.toFixed(2)}</p>
                </li>
              ))}
            </ul>
            <Link href={bookHref} onClick={dismiss} className="mt-8 inline-flex rounded-md bg-[var(--teal)] px-6 py-3 text-sm font-semibold text-[var(--off-white)]">
              Book with these details
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
