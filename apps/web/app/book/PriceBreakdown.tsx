"use client";

import { useEffect, useState } from "react";
import type { DutyEstimate } from "@/lib/domain/duty-estimate";

export type PriceDue = {
  currency: string;
  shipping: number;
  duties: DutyEstimate | null;
  total: number;
  incoterm: "DAP" | "DDP";
  problem: string | null;
};

/** Loads the breakdown once a quote exists, and again after each invoice save (DAP/DDP, values). */
export function usePriceDue(shipmentId: string, hasQuote: boolean, revision: number): PriceDue | null {
  const [due, setDue] = useState<PriceDue | null>(null);
  useEffect(() => {
    if (!hasQuote) return;
    fetch(`/api/bookings/${shipmentId}/price`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDue(data as PriceDue | null))
      .catch((err) => console.error("[PriceBreakdown.tsx:usePriceDue]", err instanceof Error ? err.message : err));
  }, [shipmentId, hasQuote, revision]);
  return due;
}

const money = (currency: string, value: number) => `${currency} ${value.toFixed(2)}`;

/** Shipping, then estimated duties and taxes when the sender pays them (DDP), then the total. */
export function PriceBreakdown({ due, fallbackText }: { due: PriceDue | null; fallbackText: string }) {
  if (!due) {
    return <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">{fallbackText}</p>;
  }
  const row = "flex items-baseline justify-between gap-4 py-1.5 text-sm";
  return (
    <div className="mt-2 max-w-md rounded-md border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] px-4 py-2">
      <div className={row}><span className="text-[var(--muted)]">Shipping</span><span className="text-[var(--off-white)]">{money(due.currency, due.shipping)}</span></div>
      {due.duties ? (
        <>
          <div className={row}><span className="text-[var(--muted)]">Estimated import duty</span><span className="text-[var(--off-white)]">{money(due.currency, due.duties.duty)}</span></div>
          <div className={row}><span className="text-[var(--muted)]">Estimated import tax (VAT / GST)</span><span className="text-[var(--off-white)]">{money(due.currency, due.duties.tax)}</span></div>
          <div className={row}><span className="text-[var(--muted)]">Duty handling fee</span><span className="text-[var(--off-white)]">{money(due.currency, due.duties.fee)}</span></div>
        </>
      ) : due.incoterm === "DAP" ? (
        <div className={row}><span className="text-[var(--muted)]">Duties and taxes</span><span className="text-xs text-[var(--muted)]">Paid by the receiver on arrival</span></div>
      ) : null}
      <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] py-2">
        <span className="text-sm font-semibold text-[var(--off-white)]">Total to pay</span>
        <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">{money(due.currency, due.total)}</span>
      </div>
      {due.duties ? <p className="pb-2 text-xs text-[var(--muted)]">Duties and taxes are an estimate from the destination&apos;s published rates. Customs set the final amount.</p> : null}
      {due.problem ? <p role="alert" className="pb-2 text-xs text-[var(--danger)]">{due.problem}</p> : null}
    </div>
  );
}
