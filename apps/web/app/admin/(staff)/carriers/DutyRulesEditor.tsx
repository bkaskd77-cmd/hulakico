"use client";

import { useState } from "react";
import { BOOKING_COUNTRIES } from "@/app/book/countries";
import { saveDutyRulesAction } from "@/app/admin/(staff)/carriers/duty-actions";
import { DutyRuleRow, type DutyRowDraft } from "@/app/admin/(staff)/carriers/DutyRuleRow";
import type { DutySettings } from "@/lib/domain/duty-estimate";

function toRows(settings: DutySettings): DutyRowDraft[] {
  return Object.entries(settings.rules).map(([country, rule]) => ({
    country, dutyPercent: String(rule.dutyPercent), taxPercent: String(rule.taxPercent),
    dutyFreeUnderUsd: String(rule.dutyFreeUnderUsd), taxFreeUnderUsd: String(rule.taxFreeUnderUsd),
    includeFreight: rule.includeFreight, ddpFeeUsd: String(rule.ddpFeeUsd),
  }));
}

function toSettings(usdToNpr: string, rows: DutyRowDraft[]): DutySettings {
  return {
    usdToNpr: Number(usdToNpr),
    rules: Object.fromEntries(rows.map((row) => [row.country, {
      dutyPercent: Number(row.dutyPercent) || 0, taxPercent: Number(row.taxPercent) || 0,
      dutyFreeUnderUsd: Number(row.dutyFreeUnderUsd) || 0, taxFreeUnderUsd: Number(row.taxFreeUnderUsd) || 0,
      includeFreight: row.includeFreight, ddpFeeUsd: Number(row.ddpFeeUsd) || 0,
    }])),
  };
}

/** Admin: the countries where customers can choose DDP, with the rules used for the duty estimate. */
export function DutyRulesEditor({ initial }: { initial: DutySettings }) {
  const [usdToNpr, setUsdToNpr] = useState(String(initial.usdToNpr));
  const [rows, setRows] = useState<DutyRowDraft[]>(() => toRows(initial));
  const [adding, setAdding] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const available = BOOKING_COUNTRIES.filter((item) => item.code !== "NP" && !rows.some((row) => row.country === item.code));

  function add() {
    if (!adding) return;
    setRows((prev) => [...prev, { country: adding, dutyPercent: "", taxPercent: "", dutyFreeUnderUsd: "0", taxFreeUnderUsd: "0", includeFreight: true, ddpFeeUsd: "" }]);
    setAdding("");
  }

  async function save() {
    setPending(true);
    setMessage(null);
    try {
      const result = await saveDutyRulesAction(toSettings(usdToNpr, rows));
      setMessage("error" in result ? result.error : "Saved. DDP prices use these rules from now on.");
    } catch (error) {
      console.error("[DutyRulesEditor.tsx:save]", error instanceof Error ? error.message : error);
      setMessage("Could not save the duty table.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-12" aria-labelledby="duties-heading">
      <h2 id="duties-heading" className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">Duties & taxes (DDP)</h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
        Customers can choose DDP (sender pays duties) only for countries listed here. The estimate is added to the shipping price as separate lines.
        Rules change: check them with your carrier every few months.
      </p>
      <label className="mt-4 block max-w-xs text-sm text-[var(--muted)]">
        Exchange rate: 1 USD = NPR
        <input className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[var(--navy)] px-2 py-1.5 text-sm text-[var(--off-white)]" inputMode="decimal" value={usdToNpr} onChange={(e) => setUsdToNpr(e.target.value)} />
      </label>
      <ul className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <DutyRuleRow key={row.country} row={row}
            onChange={(patch) => setRows((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))}
            onRemove={() => setRows((prev) => prev.filter((_, i) => i !== index))} />
        ))}
      </ul>
      {rows.length === 0 ? <p className="mt-3 text-sm text-[var(--muted)]">No countries yet, so DDP is not offered anywhere.</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Country to add"
          className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[var(--navy)] px-2 py-1.5 text-sm text-[var(--off-white)]">
          <option value="">Add a country…</option>
          {available.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
        </select>
        <button type="button" onClick={add} disabled={!adding} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_40%,transparent)] px-3 py-1.5 text-sm font-semibold text-[var(--off-white)] disabled:opacity-50">Add</button>
        <button type="button" onClick={save} disabled={pending} className="ml-auto rounded-md bg-[#ffcc00] px-4 py-1.5 text-sm font-semibold text-[#191919] disabled:opacity-60">{pending ? "Saving…" : "Save duty table"}</button>
      </div>
      {message ? <p role="status" className="mt-2 text-sm text-[var(--teal)]">{message}</p> : null}
    </section>
  );
}
