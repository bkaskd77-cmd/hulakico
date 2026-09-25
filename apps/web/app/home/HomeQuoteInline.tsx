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
  const [rankedByAi, setRankedByAi] = useState(false);
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
      setRankedByAi(Boolean(data.rankedByAi));
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
      <p className="mt-2 text-sm text-[var(--muted)]">Estimate cost — ranked when intelligence is online.</p>
      <div className="mt-4 max-h-[min(52vh,28rem)] overflow-y-auto pr-1">
        <HomeQuoteFields pending={pending} onSubmit={requestQuote} />
      </div>
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      {options.length > 0 ? (
        <div className="mt-5 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-4">
          <p className={`text-sm ${rankedByAi ? "hub-ai-pulse text-[var(--teal)]" : "text-[var(--muted)]"}`}>
            {rankedByAi ? "Ranked by Hulakico AI" : "Price order (AI offline)"}
          </p>
          <ul className="mt-3 space-y-2">
            {options.map((o, i) => (
              <li
                key={o.id}
                className="hub-rank-item flex flex-wrap justify-between gap-2 border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] pt-3"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div>
                  <p className="font-[family-name:var(--font-display)] font-bold text-[var(--off-white)]">
                    #{o.rank} {o.carrierName}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {o.serviceName} · ETA {o.etaDaysMin}–{o.etaDaysMax}d
                    {o.rankReason ? ` · ${o.rankReason}` : ""}
                  </p>
                  {typeof o.rankScore === "number" && o.rankScore > 0 ? (
                    <p className="mt-0.5 text-xs text-[var(--teal)]">Score {o.rankScore.toFixed(1)}</p>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-[var(--gold)]">
                  {o.currency} {o.amount.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
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
