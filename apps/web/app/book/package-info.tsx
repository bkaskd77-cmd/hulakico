"use client";

import { billableKg } from "@/lib/domain/quoting";
import type { FormState } from "./form-types";

export const PACKAGE_TYPES = [
  { value: "DOCUMENT", label: "Document" },
  { value: "PARCEL", label: "Parcel" },
  { value: "FREIGHT_LITE", label: "Freight lite" },
] as const;

export const SERVICES = [
  { value: "EXPRESS", label: "Express" },
  { value: "ECONOMY", label: "Economy" },
  { value: "FREIGHT_ASSIST", label: "Freight assist" },
] as const;

export function optionLabel(options: ReadonlyArray<{ value: string; label: string }>, value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Charged weight the quote will use, or null until weight and size are filled in. */
export function chargedWeight(form: FormState, lane: string): { kg: number; bySize: boolean } | null {
  const weight = Number(form.weightKg);
  if (!Number.isFinite(weight) || weight <= 0) return null;
  const mode = lane === "INTERNATIONAL" ? "INTERNATIONAL" : "DOMESTIC";
  if (form.packageType === "DOCUMENT") return { kg: billableKg(weight, 0, 0, 0, mode), bySize: false };
  const [l, w, h] = [form.lengthCm, form.widthCm, form.heightCm].map(Number);
  if (![l, w, h].every((n) => Number.isFinite(n) && n > 0)) return null;
  const kg = billableKg(weight, l, w, h, mode);
  return { kg, bySize: kg > billableKg(weight, 0, 0, 0, mode) };
}

/** Live note under the box size: what weight the price is based on, and why. */
export function ChargedWeightNote({ form, lane }: { form: FormState; lane: string }) {
  const charged = chargedWeight(form, lane);
  if (!charged) return null;
  const divisor = lane === "INTERNATIONAL" ? 5000 : 6000;
  return (
    <p className="sm:col-span-2 rounded-md border border-[color-mix(in_srgb,var(--teal)_40%,transparent)] px-3 py-2 text-xs text-[var(--off-white)]">
      Charged weight: <strong>{charged.kg} kg</strong>
      <span className="text-[var(--muted)]">
        {charged.bySize
          ? ` — the box is large for its weight, so the price uses its size (L × W × H ÷ ${divisor}). A smaller box can cost less.`
          : " — your actual weight, rounded up to the next 0.5 kg."}
      </span>
    </p>
  );
}
