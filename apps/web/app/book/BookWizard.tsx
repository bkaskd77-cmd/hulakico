"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PackageFields,
  Review,
  RouteFields,
} from "./BookWizardFields";

type Step = 1 | 2 | 3;

const field =
  "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]";

export function BookWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    originCountry: "NP",
    originCity: "Kathmandu",
    originAddress: "",
    destinationCountry: "NP",
    destinationCity: "Pokhara",
    destinationAddress: "",
    packageType: "PARCEL",
    serviceClass: "EXPRESS",
    weightKg: "1",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    declaredValue: "",
    currency: "NPR",
    contents: "",
    wantsCod: false,
  });

  const lane = useMemo(
    () =>
      form.originCountry.toUpperCase() === "NP" &&
      form.destinationCountry.toUpperCase() === "NP"
        ? "DOMESTIC"
        : "INTERNATIONAL",
    [form.originCountry, form.destinationCountry],
  );

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/bookings/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          weightKg: Number(form.weightKg),
          lengthCm: form.lengthCm ? Number(form.lengthCm) : undefined,
          widthCm: form.widthCm ? Number(form.widthCm) : undefined,
          heightCm: form.heightCm ? Number(form.heightCm) : undefined,
          declaredValue: form.declaredValue
            ? Number(form.declaredValue)
            : undefined,
          wantsCod: lane === "DOMESTIC" ? form.wantsCod : false,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not save draft.");
        return;
      }
      router.push(`/book/draft/${data.shipment.id}`);
      router.refresh();
    } catch (err) {
      console.error("[BookWizard.tsx:saveDraft]", err);
      setError("Could not save draft. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={saveDraft}
      className="mx-auto w-full max-w-2xl rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">
        Booking wizard · Step {step}/3
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
        Book a shipment
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Lane: <span className="text-[var(--off-white)]">{lane}</span>
      </p>

      {step === 1 ? <RouteFields form={form} update={update} field={field} /> : null}
      {step === 2 ? (
        <PackageFields form={form} update={update} field={field} lane={lane} />
      ) : null}
      {step === 3 ? <Review form={form} lane={lane} /> : null}

      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="rounded-md border border-[var(--teal)] px-4 py-2 text-sm text-[var(--teal)]"
          >
            Back
          </button>
        ) : null}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) as Step)}
            className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save draft"}
          </button>
        )}
        <Link href="/account" className="px-2 py-2 text-sm text-[var(--teal)] underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
