import { redirect } from "next/navigation";
import { resolveStaffAccess, type StaffGateResult } from "@/lib/data/admin-guard";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export async function requireStaffPage(): Promise<Extract<StaffGateResult, { ok: true }>> {
  const access = await resolveStaffAccess(await readStaffSessionToken());
  if (!access.ok && access.status === 401) redirect("/admin");
  if (!access.ok) redirect("/admin?denied=1");
  return access;
}
