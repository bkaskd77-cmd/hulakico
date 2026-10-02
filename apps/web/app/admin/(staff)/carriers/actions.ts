"use server";

import { revalidatePath } from "next/cache";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { insertCarrier } from "@/lib/data/carrier-admin";
import { insertCityRate, updateRateCard } from "@/lib/data/rate-cards";
import { canAccess } from "@/lib/domain/staff-permissions";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

async function guard(): Promise<{ error: string } | null> {
  const access = await resolveStaffAccess(await readStaffSessionToken());
  if (!access.ok) return { error: "Staff sign in required." };
  if (!canAccess(access.staff.role, "carriers")) {
    return { error: "Your staff role cannot edit rate cards." };
  }
  return null;
}

export async function saveRateAction(input: {
  id: string;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
}): Promise<{ ok: true } | { error: string }> {
  try {
    const denied = await guard();
    if (denied) return denied;
    const result = await updateRateCard(input);
    if ("error" in result) return result;
    revalidatePath("/admin/carriers");
    return { ok: true };
  } catch (error) {
    console.error("[carriers/actions.ts:saveRateAction]", error instanceof Error ? error.message : error);
    return { error: "Could not save the rate card." };
  }
}

export async function addCityRateAction(input: {
  carrierId: string;
  serviceClass: string;
  lane: string;
  placeName: string;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
}): Promise<{ ok: true } | { error: string }> {
  try {
    const denied = await guard();
    if (denied) return denied;
    const result = await insertCityRate(input);
    if ("error" in result) return result;
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
    const denied = await guard();
    if (denied) return denied;
    const result = await insertCarrier(input);
    if ("error" in result) return result;
    revalidatePath("/admin/carriers");
    return { ok: true };
  } catch (error) {
    console.error("[carriers/actions.ts:addCarrierAction]", error instanceof Error ? error.message : error);
    return { error: "Could not add the carrier." };
  }
}
