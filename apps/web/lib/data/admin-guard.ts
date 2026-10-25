import {
  getStaffBySessionToken,
  type StaffUser,
} from "@/lib/data/staff-auth";
import { staffHasTwoStep } from "@/lib/data/staff-totp";

export type StaffGateResult =
  | { ok: true; staff: StaffUser }
  | { ok: false; status: 401 | 403; error: string; needsTwoStep?: true };

/** Any staff (ADMIN or OPS) may access Admin control surfaces. */
export async function resolveStaffAccess(
  staffSessionToken: string | null,
): Promise<StaffGateResult> {
  try {
    if (!staffSessionToken) {
      return { ok: false, status: 401, error: "Staff sign in required." };
    }
    const staff = await getStaffBySessionToken(staffSessionToken);
    if (!staff) {
      return { ok: false, status: 401, error: "Staff sign in required." };
    }
    // Every staff page and action needs two-step login; until it is set up, only the setup page works.
    if (!(await staffHasTwoStep(staff.id))) {
      return { ok: false, status: 403, error: "Turn on two-step login at /admin/two-step first.", needsTwoStep: true };
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
export async function resolveAdminAccess(
  staffSessionToken: string | null,
): Promise<StaffGateResult> {
  return await resolveStaffAccess(staffSessionToken);
}
