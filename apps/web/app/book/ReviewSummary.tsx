"use client";

import { countryName } from "./countries";
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
        <p className="text-[var(--off-white)]">
          {lane === "DOMESTIC" ? "Nepal domestic" : "International"}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--teal)]">From</p>
        <p className="text-[var(--off-white)]">
          {form.originContactName}
          {form.originCompany ? ` · ${form.originCompany}` : ""}
        </p>
        <p className="mt-1 text-[var(--muted)]">
          {form.originPhone}
          {form.originEmail ? ` · ${form.originEmail}` : ""}
        </p>
        <p className="mt-1 text-[var(--muted)]">
          {form.originLine1}
          {form.originLine2 ? `, ${form.originLine2}` : ""} · {form.originCity},{" "}
          {countryName(form.originCountry)}
          {form.originPostalCode ? ` ${form.originPostalCode}` : ""}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--teal)]">To</p>
        <p className="text-[var(--off-white)]">
          {form.destinationContactName}
          {form.destinationCompany ? ` · ${form.destinationCompany}` : ""}
        </p>
        <p className="mt-1 text-[var(--muted)]">
          {form.destinationPhone}
          {form.destinationEmail ? ` · ${form.destinationEmail}` : ""}
        </p>
        <p className="mt-1 text-[var(--muted)]">
          {form.destinationLine1}
          {form.destinationLine2 ? `, ${form.destinationLine2}` : ""} ·{" "}
          {form.destinationCity}, {countryName(form.destinationCountry)}
          {form.destinationPostalCode ? ` ${form.destinationPostalCode}` : ""}
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
