import { resolveStaffAccess, type StaffGateResult } from "@/lib/data/admin-guard";

/** Ops APIs and desks require a staff session (ADMIN or OPS). */
export async function resolveOpsAccess(
  staffSessionToken: string | null,
): Promise<StaffGateResult> {
  return await resolveStaffAccess(staffSessionToken);
}
