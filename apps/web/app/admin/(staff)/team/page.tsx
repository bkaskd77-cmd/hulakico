import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { writeAudit } from "@/lib/data/audit-log";
import { ActivityLog, isActivityGroup } from "@/app/admin/(staff)/team/ActivityLog";
import { ASSIGNABLE_ROLES, changeStaffRole, isAssignableRole, listTeam, removeStaffAccess } from "@/lib/data/staff-team";
import { canAccess, ROLE_HINTS, ROLE_LABELS, STAFF_LIMITS } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

// Notices are chosen by key so the URL can never put arbitrary text on this page.
const NOTICES: Record<string, { text: string; error?: boolean }> = {
  role: { text: "Role updated. It applies on their next page load." },
  removed: { text: "Access removed. They have been signed out everywhere." },
  confirm: { text: "Tick the confirmation box to remove access.", error: true },
  self: { text: "You cannot change your own access here.", error: true },
  admin: { text: "The Admin account cannot be changed here.", error: true },
  limit: { text: "That role is already at its limit. Remove someone from it first.", error: true },
  failed: { text: "That change could not be saved. Try again.", error: true },
};
const CARD = "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5";
const BUTTON = "rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--off-white)] hover:border-[var(--gold)]";
const SELECT = "rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[var(--navy)] px-2 py-1.5 text-xs text-[var(--off-white)]";

function noticeKey(error: string): string {
  if (error.includes("own access")) return "self";
  if (error.includes("Admin account")) return "admin";
  if (error.includes("limit")) return "limit";
  return "failed";
}

/** Admin only. Returns the acting staff member, or null when not allowed. */
async function teamActor() {
  const access = await resolveStaffAccess(await readStaffSessionToken());
  return access.ok && canAccess(access.staff.role, "team") ? access.staff : null;
}

async function changeRoleAction(formData: FormData): Promise<void> {
  "use server";
  let notice = "failed";
  try {
    const actor = await teamActor();
    const role = formData.get("role");
    if (actor && isAssignableRole(role)) {
      const targetId = String(formData.get("id") ?? "");
      const result = await changeStaffRole(actor.id, targetId, role);
      notice = "error" in result ? noticeKey(result.error) : "role";
      if (!("error" in result)) await writeAudit(actor, "team.role", targetId, role);
    }
  } catch (error) {
    console.error("[team/page.tsx:changeRoleAction]", error instanceof Error ? error.message : error);
  }
  revalidatePath("/admin/team");
  redirect(`/admin/team?notice=${notice}`);
}

async function removeAccessAction(formData: FormData): Promise<void> {
  "use server";
  let notice = "failed";
  try {
    const actor = await teamActor();
    if (actor && formData.get("confirm") !== "yes") notice = "confirm";
    else if (actor) {
      const targetId = String(formData.get("id") ?? "");
      const result = await removeStaffAccess(actor.id, targetId);
      notice = "error" in result ? noticeKey(result.error) : "removed";
      if (!("error" in result)) await writeAudit(actor, "team.remove", targetId);
    }
  } catch (error) {
    console.error("[team/page.tsx:removeAccessAction]", error instanceof Error ? error.message : error);
  }
  revalidatePath("/admin/team");
  redirect(`/admin/team?notice=${notice}`);
}

export default async function AdminTeamPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await requireStaffPage("team");
  const params = await searchParams;
  const notice = NOTICES[String(params.notice ?? "")];
  const team = await listTeam();

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Staff</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">Team</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Everyone with Admin access. Change a role or remove access. Limits: 1 Admin, {STAFF_LIMITS.EDITOR} Editors, {STAFF_LIMITS.SUB_ADMIN} Sub-admins.
      </p>
      <Link href="/admin/signup" className={`${BUTTON} mt-5 inline-block bg-[var(--gold)] text-[var(--navy)]`}>Add staff account</Link>

      {notice ? <p role={notice.error ? "alert" : "status"} className={`mt-6 text-sm ${notice.error ? "text-[var(--danger)]" : "text-[var(--teal)]"}`}>{notice.text}</p> : null}
      {"error" in team ? <p role="alert" className="mt-6 text-sm text-[var(--danger)]">{team.error}</p> : null}

      <ul className="mt-6 space-y-4">
        {"error" in team ? null : team.map((member) => {
          const self = member.id === access.staff.id;
          const locked = self || member.role === "ADMIN";
          return (
            <li key={member.id} className={CARD}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--off-white)]">{member.name}{self ? " (you)" : ""}</p>
                  <p className="mt-0.5 break-all text-sm text-[var(--teal)]">{member.email}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {ROLE_LABELS[member.role]}: {ROLE_HINTS[member.role]} · added {new Date(member.createdAt).toLocaleDateString("en-GB", { timeZone: "Asia/Kathmandu" })}
                    {member.activeSessions ? ` · signed in on ${member.activeSessions} device${member.activeSessions > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--off-white)]">{ROLE_LABELS[member.role]}</span>
              </div>
              {locked ? null : (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <form action={changeRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={member.id} />
                    <select name="role" defaultValue={member.role} aria-label={`Role for ${member.name}`} className={SELECT}>
                      {ASSIGNABLE_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                    </select>
                    <button type="submit" className={BUTTON}>Change role</button>
                  </form>
                  <form action={removeAccessAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={member.id} />
                    <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <input type="checkbox" name="confirm" value="yes" required /> Confirm
                    </label>
                    <button type="submit" className={`${BUTTON} text-[var(--danger)] hover:border-[var(--danger)]`}>Remove access</button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {access.staff.role === "ADMIN" ? (
        <section className="mt-12 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">Database backup</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">A verified copy of all data is saved every night (14 days kept). Download the newest one to keep a copy on your own computer. It contains customer details: store it safely.</p>
          <a href="/api/admin/backup" download className="mt-4 inline-block rounded-md bg-[#ffcc00] px-4 py-2 text-sm font-semibold text-[#191919]">Download latest backup</a>
        </section>
      ) : null}

      <ActivityLog group={isActivityGroup(params.log) ? params.log : "all"} />
    </>
  );
}
