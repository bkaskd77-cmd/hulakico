"use client";

import { useState } from "react";
import { countryName } from "@/app/book/countries";
import { suggestDutyRuleAction } from "@/app/admin/(staff)/carriers/duty-actions";

export type DutyRowDraft = {
  country: string;
  dutyPercent: string;
  taxPercent: string;
  dutyFreeUnderUsd: string;
  taxFreeUnderUsd: string;
  includeFreight: boolean;
  ddpFeeUsd: string;
};

const INPUT = "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[var(--navy)] px-2 py-1.5 text-sm text-[var(--off-white)]";

const NUMBER_FIELDS: Array<{ key: Exclude<keyof DutyRowDraft, "country" | "includeFreight">; label: string }> = [
  { key: "dutyPercent", label: "Duty %" },
  { key: "taxPercent", label: "VAT / GST %" },
  { key: "dutyFreeUnderUsd", label: "No duty under (USD)" },
  { key: "taxFreeUnderUsd", label: "No tax under (USD)" },
  { key: "ddpFeeUsd", label: "DDP fee (USD)" },
];

/** One destination in the duty table, with an AI proposal staff can accept or change. */
export function DutyRuleRow({ row, onChange, onRemove }: {
  row: DutyRowDraft;
  onChange: (patch: Partial<DutyRowDraft>) => void;
  onRemove: () => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function askAi() {
    setPending(true);
    setNote(null);
    try {
      const result = await suggestDutyRuleAction(row.country);
      if ("error" in result) return setNote(result.error);
      onChange({
        dutyPercent: String(result.dutyPercent), taxPercent: String(result.taxPercent),
        dutyFreeUnderUsd: String(result.dutyFreeUnderUsd), taxFreeUnderUsd: String(result.taxFreeUnderUsd),
        includeFreight: result.includeFreight, ddpFeeUsd: String(result.ddpFeeUsd),
      });
      setNote(`AI suggestion — check before saving: ${result.explanation}`);
    } catch (error) {
      console.error("[DutyRuleRow.tsx:askAi]", error instanceof Error ? error.message : error);
      setNote("The AI suggestion failed. Enter the figures by hand.");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-[var(--off-white)]">{countryName(row.country)} <span className="text-xs text-[var(--muted)]">{row.country}</span></p>
        <div className="flex gap-2">
          <button type="button" onClick={askAi} disabled={pending} className="rounded-md border border-[var(--teal)] px-2.5 py-1 text-xs font-semibold text-[var(--teal)] disabled:opacity-60">{pending ? "Asking AI…" : "Ask AI"}</button>
          <button type="button" onClick={onRemove} className="rounded-md border border-[color-mix(in_srgb,var(--danger)_60%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--danger)]">Remove</button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {NUMBER_FIELDS.map((field) => (
          <label key={field.key} className="text-xs text-[var(--muted)]">
            {field.label}
            <input className={INPUT} inputMode="decimal" value={row[field.key]} onChange={(e) => onChange({ [field.key]: e.target.value })} />
          </label>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-[var(--off-white)]">
        <input type="checkbox" checked={row.includeFreight} onChange={(e) => onChange({ includeFreight: e.target.checked })} />
        Customs value includes freight and insurance (EU, UK, most of Asia). Untick for goods value only (USA).
      </label>
      {note ? <p className="mt-2 text-xs text-[var(--gold)]">{note}</p> : null}
    </li>
  );
}
