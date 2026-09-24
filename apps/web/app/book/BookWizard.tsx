"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedAddress } from "@/lib/data/addresses";
import { applyCountryDefaults } from "./country-defaults";
import {
  applyLaneMode,
  postBookingDraft,
  quoteAndConfirmBooking,
} from "./post-draft";
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
import { WizardNav } from "./WizardNav";

type Step = 1 | 2 | 3;

export function BookWizard({
  initialAddresses,
  initialForm,
  initialStep = 1,
  rebookHint,
}: {
  initialAddresses: SavedAddress[];
  initialForm?: FormState;
  initialStep?: Step;
  rebookHint?: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm ?? INITIAL_BOOK_FORM);
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

  function goBack() {
    setError(null);
    setStep((s) => (s - 1) as Step);
  }

  async function bookShipment(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (blockIfRouteInvalid()) {
      setStep(1);
      return;
    }
    setPending(true);
    const draft = await postBookingDraft(form, lane);
    if ("error" in draft) {
      setPending(false);
      setError(draft.error);
      return;
    }
    const booked = await quoteAndConfirmBooking(draft.id);
    setPending(false);
    if ("error" in booked) {
      setError(booked.error);
      return;
    }
    router.push(`/book/booked/${draft.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={bookShipment}
      noValidate
      className="shell-rise mx-auto w-full max-w-2xl rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">Hulakico booking</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">Book a shipment</h1>
      {rebookHint ? <p className="mt-2 text-sm text-[var(--gold)]">{rebookHint}</p> : null}
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
      {/* Keep all steps mounted so Back preserves entered values. */}
      <RevealRouteErrors.Provider value={revealRouteErrors}>
        <div className={step === 1 ? "block" : "hidden"} aria-hidden={step !== 1}>
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
        </div>
      </RevealRouteErrors.Provider>
      <div className={step === 2 ? "block" : "hidden"} aria-hidden={step !== 2}>
        <PackageFields form={form} update={update} field={BOOK_FIELD} lane={lane} />
      </div>
      <div className={step === 3 ? "block" : "hidden"} aria-hidden={step !== 3}>
        <ReviewSummary form={form} lane={lane} />
      </div>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      <WizardNav step={step} pending={pending} onBack={goBack} onContinue={goNext} />
    </form>
  );
}
