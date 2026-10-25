"use server";

import { revalidatePath } from "next/cache";
import { suggestDutyRule, type DutySuggestion } from "@/lib/ai/duty-suggest";
import { countryName } from "@/app/book/countries";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { writeAudit } from "@/lib/data/audit-log";
import { saveDutySettings } from "@/lib/data/duty-settings";
import type { DutySettings } from "@/lib/domain/duty-estimate";
import { canAccess } from "@/lib/domain/staff-permissions";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

async function staffWithRates() {
  const access = await resolveStaffAccess(await readStaffSessionToken());
  return access.ok && canAccess(access.staff.role, "carriers") ? access.staff : null;
}

/** Admin: save the DDP duty table (every country at once) and the USD → NPR rate. */
export async function saveDutyRulesAction(settings: DutySettings): Promise<{ ok: true } | { error: string }> {
  try {
    const staff = await staffWithRates();
    if (!staff) return { error: "Your staff role cannot edit rates." };
    const result = await saveDutySettings(settings);
    if ("error" in result) return result;
    await writeAudit(staff, "rate.duties", "Duty table", `USD→NPR ${result.settings.usdToNpr}; countries: ${Object.keys(result.settings.rules).join(", ") || "none"}`);
    revalidatePath("/admin/carriers");
    return { ok: true };
  } catch (error) {
    console.error("[duty-actions.ts:saveDutyRulesAction]", error instanceof Error ? error.message : error);
    return { error: "Could not save the duty table." };
  }
}

/** Admin: AI proposal of typical import rules for one country, for staff to review. */
export async function suggestDutyRuleAction(country: string): Promise<DutySuggestion | { error: string }> {
  try {
    if (!(await staffWithRates())) return { error: "Your staff role cannot edit rates." };
    const code = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return { error: "Choose a country first." };
    return await suggestDutyRule(code, countryName(code));
  } catch (error) {
    console.error("[duty-actions.ts:suggestDutyRuleAction]", error instanceof Error ? error.message : error);
    return { error: "The AI suggestion failed. Enter the figures by hand." };
  }
}
