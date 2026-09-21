"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedAddress } from "@/lib/data/addresses";
import { applyCountryDefaults } from "./country-defaults";
import { applyLaneMode, postBookingDraft } from "./post-draft";
import { pickPlaceForLane, pickSavedForLane } from "./lane-pick";
import { ReviewSummary } from "./ReviewSummary";
import { RouteFields } from "./RouteFields";
import { BOOK_FIELD, INITIAL_BOOK_FORM, type FormState } from "./form-types";
import { PackageFields } from "./PackageFields";
import {
  detectFormLane,
  RevealRouteErrors,
  validateRouteForm,
} from "./validate-route";

type Step = 1 | 2 | 3;
const BTN =
  "rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]";

export function BookWizard({
  initialAddresses,
}: {
  initialAddresses: SavedAddress[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_BOOK_FORM);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [revealRouteErrors, setRevealRouteErrors] = useState(false);
  const lane = detectFormLane(form);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key !== "originCountry" && key !== "destinationCountry") return next;
      return applyCountryDefaults(next);
    });
  }

  function blockIfRouteInvalid(): boolean {
    const result = validateRouteForm(form);
    if (!result.ok) {
      setRevealRouteErrors(true);
      setError(result.summary);
    }
    return !result.ok;
  }

  function goNext() {
    setError(null);
    if (step === 1 && blockIfRouteInvalid()) return;
    setStep((s) => (s + 1) as Step);
  }

  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (blockIfRouteInvalid()) {
      setStep(1);
      return;
    }
    setPending(true);
    const result = await postBookingDraft(form, lane);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/book/draft/${result.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={saveDraft}
      noValidate
      className="shell-rise mx-auto w-full max-w-2xl rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">Hulakico booking</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
        Book a shipment
      </h1>
      <div className="mt-5 flex gap-2">
        {(["DOMESTIC", "INTERNATIONAL"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setForm((prev) => applyLaneMode(prev, mode))}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              lane === mode ? "bg-[var(--gold)] text-[var(--navy)]" : "border border-[var(--teal)] text-[var(--teal)]"
            }`}
          >
            {mode === "DOMESTIC" ? "Nepal domestic" : "International"}
          </button>
        ))}
      </div>
      <ol className="mt-6 flex gap-2">
        {([1, 2, 3] as Step[]).map((n) => (
          <li key={n} className={`flex-1 rounded-md px-2 py-2 text-center text-xs font-semibold ${
            step === n ? "bg-[var(--teal)] text-[var(--off-white)]"
              : step > n ? "bg-[color-mix(in_srgb,var(--teal)_35%,transparent)] text-[var(--off-white)]"
              : "bg-[var(--navy)] text-[var(--muted)]"
          }`}>{n}. {n === 1 ? "Route" : n === 2 ? "Package" : "Review"}</li>
        ))}
      </ol>
      <RevealRouteErrors.Provider value={revealRouteErrors}>
        {step === 1 ? (
          <RouteFields
            form={form}
            update={update}
            field={BOOK_FIELD}
            lane={lane}
            addresses={addresses}
            onPickOrigin={(a) => setForm((p) => pickSavedForLane(p, "origin", a, lane))}
            onPickDestination={(a) => setForm((p) => pickSavedForLane(p, "destination", a, lane))}
            onSaved={(a) => setAddresses((prev) => [a, ...prev])}
            onPlaceOrigin={(p) => setForm((prev) => pickPlaceForLane(prev, "origin", p, lane))}
            onPlaceDestination={(p) => setForm((prev) => pickPlaceForLane(prev, "destination", p, lane))}
          />
        ) : null}
      </RevealRouteErrors.Provider>
      {step === 2 ? <PackageFields form={form} update={update} field={BOOK_FIELD} lane={lane} /> : null}
      {step === 3 ? <ReviewSummary form={form} lane={lane} /> : null}
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="mt-8 flex flex-wrap gap-3">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className="rounded-md border border-[var(--teal)] px-4 py-2 text-sm text-[var(--teal)]">Back</button>
        ) : null}
        {step < 3 ? (
          <button type="button" onClick={goNext} className={BTN}>Continue</button>
        ) : (
          <button type="submit" disabled={pending} className={`${BTN} disabled:opacity-60`}>
            {pending ? "Saving…" : "Save draft & get quotes"}
          </button>
        )}
        <Link href="/account" className="px-2 py-2 text-sm text-[var(--teal)] underline">Cancel</Link>
      </div>
    </form>
  );
}
