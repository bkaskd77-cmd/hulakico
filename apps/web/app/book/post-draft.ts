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
