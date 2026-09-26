"use server";

import { redirect } from "next/navigation";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getCopyFormState } from "@/lib/data/copy-shipment";
import { readSessionToken } from "@/lib/http/session-cookie";

/** Opens the booking wizard prefilled from a past shipment (stepwise review). */
export async function copyShipmentAction(formData: FormData) {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) redirect("/signin");

    const shipmentId = String(formData.get("shipmentId") ?? "").trim();
    if (!shipmentId) redirect("/account?copy=missing");

    const loaded = getCopyFormState(user.id, shipmentId);
    if ("error" in loaded) {
      redirect(`/account?copy=${encodeURIComponent(loaded.error)}`);
    }
    redirect(`/book?copyFrom=${encodeURIComponent(shipmentId)}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error(
      "[copy-actions.ts:copyShipmentAction]",
      error instanceof Error ? error.message : error,
    );
    redirect("/account?copy=failed");
  }
}
