import {
  getStaffBySessionToken,
  type StaffUser,
} from "@/lib/data/staff-auth";

export type StaffGateResult =
  | { ok: true; staff: StaffUser }
  | { ok: false; status: 401 | 403; error: string };

/** Any staff (ADMIN or OPS) may access Admin control surfaces. */
export function resolveStaffAccess(
  staffSessionToken: string | null,
): StaffGateResult {
  try {
    if (!staffSessionToken) {
      return { ok: false, status: 401, error: "Staff sign in required." };
    }
    const staff = getStaffBySessionToken(staffSessionToken);
    if (!staff) {
      return { ok: false, status: 401, error: "Staff sign in required." };
    }
    return { ok: true, staff };
  } catch (error) {
    console.error(
      "[admin-guard.ts:resolveStaffAccess]",
      error instanceof Error ? error.message : error,
    );
    return { ok: false, status: 401, error: "Could not verify staff access." };
  }
}

/** @deprecated Use resolveStaffAccess — kept name for existing imports. */
export function resolveAdminAccess(
  staffSessionToken: string | null,
): StaffGateResult {
  return resolveStaffAccess(staffSessionToken);
}
