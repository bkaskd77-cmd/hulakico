"use client";

import { useEffect, useState } from "react";
import type { CustomsCheckResult } from "@/lib/ai/customs-check";
import type { LineDraft } from "./InvoiceLineFields";

type Check = CustomsCheckResult & { checkedAt: string };

const VERDICT = {
  clear: { title: "No problems found", tone: "border-emerald-400 bg-emerald-500/10" },
  check: { title: "Some items need documents or care", tone: "border-amber-300 bg-amber-400/10" },
  prohibited: { title: "Some items cannot be shipped there", tone: "border-red-400 bg-red-500/10" },
} as const;

const STATUS = {
  ok: "text-emerald-300",
  restricted: "text-amber-200",
  prohibited: "text-red-300",
} as const;

/**
 * AI customs desk on the invoice: suggests HS codes and flags items the destination or the
 * carrier restricts. Advice only; the customer applies suggestions and staff make the final call.
 */
export function AiCustomsCheck({ shipmentId, currency, exportReason, lines, onApply }: {
  shipmentId: string;
  currency: string;
  exportReason: string;
  lines: LineDraft[];
  onApply: (index: number, patch: Partial<LineDraft>) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [check, setCheck] = useState<Check | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${shipmentId}/invoice/ai-check`)
      .then((response) => (response.ok ? response.json() : { enabled: false }))
      .then((data: { enabled?: boolean }) => setEnabled(Boolean(data.enabled)))
      .catch((err) => console.error("[AiCustomsCheck.tsx:status]", err instanceof Error ? err.message : err));
  }, [shipmentId]);

  async function run() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/bookings/${shipmentId}/invoice/ai-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          exportReason,
          lines: lines.filter((line) => line.description.trim().length >= 2).map((line) => ({
            description: line.description.trim(),
            quantity: Number(line.quantity) || 0,
            unitValue: Number(line.unitValue) || 0,
            countryOfOrigin: line.countryOfOrigin.trim().toUpperCase().slice(0, 2),
            hsCode: line.hsCode.trim(),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "The AI check failed.");
      setCheck(data.check as Check);
    } catch (err) {
      console.error("[AiCustomsCheck.tsx:run]", err instanceof Error ? err.message : err);
      setError("The AI check failed. You can still save the invoice.");
    } finally {
      setPending(false);
    }
  }

  if (!enabled) return null;
  const verdict = check ? VERDICT[check.verdict] : null;
  return (
    <section aria-live="polite" className="rounded-md border border-[color-mix(in_srgb,var(--teal)_50%,transparent)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--off-white)]">AI customs check <span className="font-normal text-[var(--muted)]">· HS codes and restrictions for your destination</span></p>
        <button type="button" onClick={run} disabled={pending || !lines.some((line) => line.description.trim().length >= 2)}
          className="rounded-md bg-[#ffcc00] px-3 py-1.5 text-xs font-semibold text-[#191919] disabled:opacity-60">
          {pending ? "Checking… (up to a minute)" : check ? "Check again" : "Check with AI"}
        </button>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
      {check && verdict ? (
        <div className={`mt-3 rounded-md border p-3 ${verdict.tone}`}>
          <p className="text-sm font-semibold text-[var(--off-white)]">{verdict.title}</p>
          <p className="mt-1 text-xs text-[var(--off-white)]">{check.summary}</p>
          <ul className="mt-3 space-y-3">
            {check.lines.map((item) => {
              const line = lines.filter((entry) => entry.description.trim().length >= 2)[item.index];
              const lineIndex = line ? lines.indexOf(line) : -1;
              return (
                <li key={item.index} className="border-t border-white/10 pt-2 text-xs">
                  <p className="font-semibold text-[var(--off-white)]">{line?.description ?? `Item ${item.index + 1}`} · <span className={STATUS[item.status]}>{item.status === "ok" ? "OK to ship" : item.status}</span></p>
                  {item.reason ? <p className="mt-0.5 text-[var(--off-white)]/90">{item.reason}</p> : null}
                  {item.documents.length ? <p className="mt-0.5 text-[var(--muted)]">Needs: {item.documents.join(", ")}</p> : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[var(--gold)]">HS {item.suggestedHsCode}</span>
                    <span className="text-[var(--muted)]">{item.hsTitle} · {item.confidence} confidence</span>
                    {lineIndex >= 0 && line?.hsCode.trim() !== item.suggestedHsCode ? (
                      <button type="button" onClick={() => onApply(lineIndex, { hsCode: item.suggestedHsCode })} className="rounded border border-[var(--teal)] px-2 py-0.5 font-semibold text-[var(--teal)]">Use this code</button>
                    ) : null}
                    {lineIndex >= 0 && item.betterDescription && item.betterDescription !== line?.description ? (
                      <button type="button" onClick={() => onApply(lineIndex, { description: item.betterDescription.slice(0, 200) })} className="rounded border border-[var(--teal)] px-2 py-0.5 font-semibold text-[var(--teal)]">Use description: “{item.betterDescription.slice(0, 60)}{item.betterDescription.length > 60 ? "…" : ""}”</button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[10px] text-[var(--muted)]">AI advice, not a legal ruling. Hulakico staff review flagged items before pickup.</p>
        </div>
      ) : null}
    </section>
  );
}
