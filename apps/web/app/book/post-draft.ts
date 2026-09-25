import type { FormState } from "./form-types";

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export async function postBookingDraft(
  form: FormState,
  lane: string,
): Promise<{ id: string } | { error: string }> {
  try {
    const response = await fetch("/api/bookings/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        originCompany: emptyToUndefined(form.originCompany),
        originEmail: emptyToUndefined(form.originEmail),
        originLine2: emptyToUndefined(form.originLine2),
        originPostalCode: emptyToUndefined(form.originPostalCode),
        destinationCompany: emptyToUndefined(form.destinationCompany),
        destinationEmail: emptyToUndefined(form.destinationEmail),
        destinationLine2: emptyToUndefined(form.destinationLine2),
        destinationPostalCode: emptyToUndefined(form.destinationPostalCode),
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
      return { error: data.error || "Could not save draft." };
    }
    return { id: data.shipment.id as string };
  } catch (error) {
    console.error(
      "[post-draft.ts:postBookingDraft]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not save draft. Please try again." };
  }
}

/** Generate quotes then return the top-ranked option (no confirm). */
export async function prepareQuotesForPayment(
  shipmentId: string,
): Promise<
  | { quoteOptionId: string; amount: number; currency: string }
  | { error: string }
> {
  try {
    const quotesRes = await fetch(`/api/bookings/${shipmentId}/quotes`, {
      method: "POST",
    });
    const quotesData = await quotesRes.json();
    if (!quotesRes.ok) {
      return { error: quotesData.error || "Could not generate quotes." };
    }
    const options = quotesData.options as
      | Array<{ id: string; amount: number; currency: string }>
      | undefined;
    if (!options?.length) {
      return { error: "No carrier quotes available." };
    }
    const top = options[0];
    return {
      quoteOptionId: top.id,
      amount: top.amount,
      currency: top.currency,
    };
  } catch (error) {
    console.error(
      "[post-draft.ts:prepareQuotesForPayment]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not generate quotes. Please try again." };
  }
}

/** Confirm booking with a known quote option (requires COD or PAID intent). */
export async function confirmBookingWithQuote(
  shipmentId: string,
  quoteOptionId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const confirmRes = await fetch(`/api/bookings/${shipmentId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteOptionId }),
    });
    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) {
      return { error: confirmData.error || "Booking failed." };
    }
    return { ok: true };
  } catch (error) {
    console.error(
      "[post-draft.ts:confirmBookingWithQuote]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Booking failed. Please try again." };
  }
}

/** Generate quotes then confirm with the top-ranked option (COD or paid only). */
export async function quoteAndConfirmBooking(
  shipmentId: string,
): Promise<{ ok: true } | { error: string }> {
  const prepared = await prepareQuotesForPayment(shipmentId);
  if ("error" in prepared) return prepared;
  return confirmBookingWithQuote(shipmentId, prepared.quoteOptionId);
}

export function applyLaneMode(
  prev: FormState,
  mode: "DOMESTIC" | "INTERNATIONAL",
): FormState {
  if (mode === "DOMESTIC") {
    return {
      ...prev,
      originCountry: "NP",
      destinationCountry: "NP",
      currency: "NPR",
    };
  }
  const leavingNepalDestination = prev.destinationCountry.toUpperCase() === "NP";
  return {
    ...prev,
    destinationCountry: leavingNepalDestination ? "IN" : prev.destinationCountry,
    destinationCity: leavingNepalDestination ? "" : prev.destinationCity,
    destinationPostalCode: leavingNepalDestination
      ? ""
      : prev.destinationPostalCode,
    wantsCod: false,
    currency: prev.currency === "NPR" ? "USD" : prev.currency,
  };
}
