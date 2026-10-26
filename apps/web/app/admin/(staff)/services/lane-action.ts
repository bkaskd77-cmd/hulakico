"use server";

import { revalidatePath } from "next/cache";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { writeAudit } from "@/lib/data/audit-log";
import { removeLaneCopy } from "@/lib/data/lane-remove";
import { canAccess } from "@/lib/domain/staff-permissions";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

/** Removes a country page that staff added (not the built-in ones). */
export async function removeLaneAction(slug: string): Promise<{ ok: true } | { error: string }> {
  try {
    const access = await resolveStaffAccess(await readStaffSessionToken());
    if (!access.ok || !canAccess(access.staff.role, "content")) return { error: "Your staff role cannot edit website content." };
    const result = await removeLaneCopy(String(slug));
    if ("error" in result) return result;
    await writeAudit(access.staff, "content.lane_remove", String(slug));
    revalidatePath("/services/international");
    revalidatePath(`/services/international/${slug}`);
    revalidatePath("/admin/services");
    return { ok: true };
  } catch (error) {
    console.error("[lane-action.ts:removeLaneAction]", error instanceof Error ? error.message : error);
    return { error: "Could not remove this country page." };
  }
}
