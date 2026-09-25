"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedAddress } from "@/lib/data/addresses";
import { applyCountryDefaults } from "./country-defaults";
import {
  applyLaneMode,
  confirmBookingWithQuote,
  postBookingDraft,
  prepareQuotesForPayment,
} from "./post-draft";
import { pickPlaceForLane, pickSavedForLane } from "./lane-pick";
import { BookWizardHeader } from "./BookWizardHeader";
import { PaymentStep } from "./PaymentStep";
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

type Step = 1 | 2 | 3 | 4;
type QuoteSummary = { amount: number; currency: string; quoteOptionId: string };

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
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteSummary | null>(null);
  const lane = detectFormLane(form);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key !== "originCountry" && key !== "destinationCountry") return next;
      return applyCountryDefaults(next);
    });
  }

  async function goNext() {
    setError(null);
    if (step === 1) {
      const result = validateRouteForm(form);
      if (!result.ok) {
        setRevealRouteErrors(true);
        setError(result.summary);
        return;
      }
    }
    if (step !== 3) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    setPending(true);
    const draft = await postBookingDraft(form, lane);
    if ("error" in draft) {
      setPending(false);
      setError(draft.error);
      return;
    }
    const prepared = await prepareQuotesForPayment(draft.id);
    setPending(false);
    if ("error" in prepared) {
      setError(prepared.error);
      return;
    }
    setShipmentId(draft.id);
    setQuote(prepared);
    setStep(4);
  }

  async function bookAfterPayment() {
    if (!shipmentId || !quote) {
      setError("Missing quote. Go back to Review and continue again.");
      return;
    }
    setPending(true);
    const booked = await confirmBookingWithQuote(shipmentId, quote.quoteOptionId);
    setPending(false);
    if ("error" in booked) {
      setError(booked.error);
      return;
    }
    router.push(`/book/booked/${shipmentId}`);
    router.refresh();
  }

  return (
    <div className="shell-rise mx-auto w-full max-w-2xl rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-6 sm:p-8">
      <BookWizardHeader
        lane={lane}
        step={step}
        rebookHint={rebookHint}
        onLane={(mode) => setForm((prev) => applyLaneMode(prev, mode))}
      />
      <RevealRouteErrors.Provider value={revealRouteErrors}>
        <div className={step === 1 ? "block" : "hidden"} aria-hidden={step !== 1}>
          <RouteFields
            form={form} update={update} field={BOOK_FIELD} lane={lane} addresses={addresses}
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
      {step === 4 && shipmentId ? (
        <PaymentStep shipmentId={shipmentId} wantsCod={form.wantsCod} lane={lane}
          quote={quote} onBookCod={bookAfterPayment} pending={pending} />
      ) : null}
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      <WizardNav step={step} pending={pending}
        onBack={() => { setError(null); setStep((s) => (s - 1) as Step); }}
        onContinue={goNext}
        continueLabel={step === 3 ? "Continue to payment" : "Continue"}
        hideContinue={step === 4} />
    </div>
  );
}
