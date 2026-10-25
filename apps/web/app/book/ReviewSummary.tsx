"use client";

import { useEffect, useState } from "react";
import { countryName } from "./countries";
import type { FormState } from "./form-types";
import { chargedWeight, optionLabel, PACKAGE_TYPES, SERVICES } from "./package-info";

type Estimate = { text: string } | { error: string } | null;

const HEAD = "text-xs uppercase tracking-wide text-[var(--teal)]";

function Party({ title, form, side }: { title: string; form: FormState; side: "origin" | "destination" }) {
  const v = (key: string) => String(form[`${side}${key}` as keyof FormState] ?? "");
  return (
    <div>
      <p className={HEAD}>{title}</p>
      <p className="text-[var(--off-white)]">{v("ContactName")}{v("Company") ? ` · ${v("Company")}` : ""}</p>
      <p className="mt-1 text-[var(--muted)]">{v("Phone")}{v("Email") ? ` · ${v("Email")}` : ""}</p>
      <p className="mt-1 text-[var(--muted)]">
        {v("Line1")}{v("Line2") ? `, ${v("Line2")}` : ""} · {v("City")}, {countryName(v("Country"))}
        {v("PostalCode") ? ` ${v("PostalCode")}` : ""}
      </p>
    </div>
  );
}

/** Fetches a tentative price once per arrival on Review (same pricing as the homepage quote). */
function useEstimate(form: FormState, active: boolean): Estimate {
  const [estimate, setEstimate] = useState<Estimate>(null);
  const key = [form.originCity, form.destinationCity, form.destinationCountry, form.weightKg, form.lengthCm, form.widthCm, form.heightCm, form.serviceClass, form.packageType].join("|");
  useEffect(() => {
    if (!active) return;
    if (form.serviceClass === "FREIGHT_ASSIST") {
      queueMicrotask(() => setEstimate({ error: "Freight assist is priced by our desk after you book." }));
      return;
    }
    const isDoc = form.packageType === "DOCUMENT";
    let cancelled = false;
    fetch("/api/quotes/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originCountry: form.originCountry, originCity: form.originCity,
        destinationCountry: form.destinationCountry, destinationCity: form.destinationCity,
        weightKg: Number(form.weightKg),
        // Documents have no box size; an envelope is sent so the rate still applies.
        lengthCm: isDoc ? 32 : Number(form.lengthCm), widthCm: isDoc ? 24 : Number(form.widthCm), heightCm: isDoc ? 1 : Number(form.heightCm),
        serviceClass: form.serviceClass, packageType: form.packageType,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        const option = data.options?.[0];
        if (cancelled) return;
        if (!response.ok || !option) setEstimate({ error: data.error || "No price yet for this route. We confirm it at the next step." });
        else setEstimate({ text: `${option.currency} ${Number(option.amount).toLocaleString("en-US")} · ${option.etaDaysMin}–${option.etaDaysMax} days` });
      })
      .catch((error) => {
        console.error("[ReviewSummary.tsx:useEstimate]", error);
        if (!cancelled) setEstimate({ error: "Could not load an estimate. The price is shown at the next step." });
      });
    return () => { cancelled = true; };
    // key captures every field the price depends on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key]);
  return estimate;
}

export function ReviewSummary({ form, lane, active }: { form: FormState; lane: string; active: boolean }) {
  const estimate = useEstimate(form, active);
  const charged = chargedWeight(form, lane);
  const size = form.packageType === "DOCUMENT" ? "Envelope" : `${form.lengthCm} × ${form.widthCm} × ${form.heightCm} cm`;
  return (
    <div className="mt-6 space-y-4 text-sm">
      <div>
        <p className={HEAD}>Lane</p>
        <p className="text-[var(--off-white)]">{lane === "DOMESTIC" ? "Nepal domestic" : "International"}</p>
      </div>
      <Party title="From" form={form} side="origin" />
      <Party title="To" form={form} side="destination" />
      <div>
        <p className={HEAD}>Package</p>
        <p className="text-[var(--off-white)]">
          {optionLabel(PACKAGE_TYPES, form.packageType)} · {optionLabel(SERVICES, form.serviceClass)} · {form.weightKg} kg · {size}
        </p>
        {charged ? <p className="mt-1 text-[var(--muted)]">Charged weight {charged.kg} kg{charged.bySize ? " (by box size)" : ""}</p> : null}
        <p className="mt-1 text-[var(--muted)]">{form.contents}</p>
        <p className="mt-1 text-[var(--muted)]">
          Value: {form.declaredValue || "—"} {form.currency}
          {lane === "DOMESTIC" ? ` · COD: ${form.wantsCod ? "Yes" : "No"}` : ""}
        </p>
      </div>
      <div className="rounded-md border border-[color-mix(in_srgb,var(--teal)_40%,transparent)] px-3 py-2">
        <p className={HEAD}>Estimated price</p>
        {estimate === null ? <p className="text-[var(--muted)]">Calculating…</p> : null}
        {estimate && "text" in estimate ? <p className="text-base font-semibold text-[var(--off-white)]">{estimate.text}</p> : null}
        {estimate && "error" in estimate ? <p className="text-[var(--muted)]">{estimate.error}</p> : null}
        <p className="mt-1 text-xs text-[var(--muted)]">Tentative. The final price is confirmed at payment and can change if the measured box differs.</p>
      </div>
    </div>
  );
}
