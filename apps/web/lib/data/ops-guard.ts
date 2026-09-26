import { resolveStaffAccess, type StaffGateResult } from "@/lib/data/admin-guard";
import { canAccess } from "@/lib/domain/staff-permissions";

/** Ops APIs and desks require a staff session whose role covers operations (Admin or Sub-admin). */
export async function resolveOpsAccess(
  staffSessionToken: string | null,
): Promise<StaffGateResult> {
  const access = await resolveStaffAccess(staffSessionToken);
  if (access.ok && !canAccess(access.staff.role, "operations")) {
    return { ok: false, status: 403, error: "Your staff role does not include operations." };
  }
  return access;
}
