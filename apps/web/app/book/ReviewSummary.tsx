"use client";

import type { FormState } from "./form-types";

export function ReviewSummary({
  form,
  lane,
}: {
  form: FormState;
  lane: string;
}) {
  return (
    <div className="mt-6 space-y-4 text-sm">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--teal)]">Lane</p>
        <p className="text-[var(--off-white)]">{lane}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--teal)]">Route</p>
        <p className="text-[var(--off-white)]">
          {form.originCity}, {form.originCountry} → {form.destinationCity},{" "}
          {form.destinationCountry}
        </p>
        <p className="mt-1 text-[var(--muted)]">
          {form.originAddress} → {form.destinationAddress}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--teal)]">
          Package
        </p>
        <p className="text-[var(--off-white)]">
          {form.packageType} · {form.serviceClass} · {form.weightKg} kg
        </p>
        <p className="mt-1 text-[var(--muted)]">{form.contents}</p>
        <p className="mt-1 text-[var(--muted)]">
          Value: {form.declaredValue || "—"} {form.currency}
          {lane === "DOMESTIC"
            ? ` · COD: ${form.wantsCod ? "Yes" : "No"}`
            : " · COD: n/a"}
        </p>
      </div>
    </div>
  );
}
