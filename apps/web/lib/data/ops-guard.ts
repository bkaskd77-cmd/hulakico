import { resolveStaffAccess, type StaffGateResult } from "@/lib/data/admin-guard";

/** Ops APIs and desks require a staff session (ADMIN or OPS). */
export function resolveOpsAccess(
  staffSessionToken: string | null,
): StaffGateResult {
  return resolveStaffAccess(staffSessionToken);
}
