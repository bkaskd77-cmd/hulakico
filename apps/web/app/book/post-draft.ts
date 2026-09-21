import type { FormState } from "./form-types";

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
  return {
    ...prev,
    destinationCountry:
      prev.destinationCountry === "NP" ? "IN" : prev.destinationCountry,
    wantsCod: false,
    currency: prev.currency === "NPR" ? "USD" : prev.currency,
  };
}
