"use server";

import { revalidatePath } from "next/cache";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { writeAudit } from "@/lib/data/audit-log";
import type { StaffUser } from "@/lib/data/staff-auth";
import { insertCarrier } from "@/lib/data/carrier-admin";
import { deleteRateCard } from "@/lib/data/rate-card-admin";
import { insertCityRate, updateRateCard } from "@/lib/data/rate-cards";
import { canAccess } from "@/lib/domain/staff-permissions";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

/** Returns the signed-in staff member allowed to edit rates, or why not. */
async function guard(): Promise<{ error: string } | { staff: StaffUser }> {
  const access = await resolveStaffAccess(await readStaffSessionToken());
  if (!access.ok) return { error: "Staff sign in required." };
  if (!canAccess(access.staff.role, "carriers")) {
    return { error: "Your staff role cannot edit rate cards." };
  }
  return { staff: access.staff };
}

export async function saveRateAction(input: {
  id: string;
  postalCodes?: string;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
}): Promise<{ ok: true } | { error: string }> {
  try {
    const allowed = await guard();
    if ("error" in allowed) return allowed;
    const result = await updateRateCard(input);
    if ("error" in result) return result;
    await writeAudit(allowed.staff, "rate.update", input.id, `${input.currency} ${input.baseAmount} + ${input.perKgAmount}/kg${input.postalCodes ? ` · postcodes ${input.postalCodes}` : ""}`);
    revalidatePath("/admin/carriers");
    return { ok: true };
  } catch (error) {
    console.error("[carriers/actions.ts:saveRateAction]", error instanceof Error ? error.message : error);
    return { error: "Could not save the rate card." };
  }
}

export async function removeRateAction(id: string): Promise<{ ok: true } | { error: string }> {
  try {
    const allowed = await guard();
    if ("error" in allowed) return allowed;
    const result = await deleteRateCard(id);
    if ("error" in result) return result;
    await writeAudit(allowed.staff, "rate.remove", id);
    revalidatePath("/admin/carriers");
    return { ok: true };
  } catch (error) {
    console.error("[carriers/actions.ts:removeRateAction]", error instanceof Error ? error.message : error);
    return { error: "Could not remove the rate card." };
  }
}

export async function addCityRateAction(input: {
  carrierId: string;
  serviceClass: string;
  lane: string;
  placeName: string;
  /** Destination country (ISO). Ignored for National, required for International. */
  country?: string;
  postalCodes?: string;
  allOtherCities?: boolean;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
}): Promise<{ ok: true } | { error: string }> {
  try {
    const allowed = await guard();
    if ("error" in allowed) return allowed;
    const result = await insertCityRate({
      ...input,
      country: input.country ?? "",
      postalCodes: input.postalCodes ?? "",
      allOtherCities: input.allOtherCities === true,
    });
    if ("error" in result) return result;
    const place = input.allOtherCities ? "All other cities" : input.placeName;
    await writeAudit(allowed.staff, "rate.add", `${input.carrierId} · ${input.serviceClass} · ${input.lane}`,
      `${place}${input.country ? `, ${input.country}` : ""} · ${input.currency} ${input.baseAmount} + ${input.perKgAmount}/kg`);
    revalidatePath("/admin/carriers");
    return { ok: true };
  } catch (error) {
    console.error("[carriers/actions.ts:addCityRateAction]", error instanceof Error ? error.message : error);
    return { error: "Could not add the rate card." };
  }
}

export async function addCarrierAction(input: {
  name: string;
  scope: string;
}): Promise<{ ok: true } | { error: string }> {
  try {
    const allowed = await guard();
    if ("error" in allowed) return allowed;
    const result = await insertCarrier(input);
    if ("error" in result) return result;
    await writeAudit(allowed.staff, "carrier.add", input.name, input.scope);
    revalidatePath("/admin/carriers");
    return { ok: true };
  } catch (error) {
    console.error("[carriers/actions.ts:addCarrierAction]", error instanceof Error ? error.message : error);
    return { error: "Could not add the carrier." };
  }
}
