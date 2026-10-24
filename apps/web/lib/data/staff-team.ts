import { getSql } from "@/lib/sql";
import type { StaffRole } from "@/lib/data/staff-auth";
import { ROLE_LABELS, STAFF_LIMITS } from "@/lib/domain/staff-permissions";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  createdAt: string;
  activeSessions: number;
};

/** Roles an Admin may hand out here. The single Admin account is never reassigned. */
export const ASSIGNABLE_ROLES = ["EDITOR", "SUB_ADMIN"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

const ID_OK = /^stf_[a-f0-9]{24}$/;

export function isAssignableRole(value: unknown): value is AssignableRole {
  return typeof value === "string" && (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

/** Everyone with staff access, Admin first, then by name. */
export async function listTeam(): Promise<TeamMember[] | { error: string }> {
  try {
    const rows = (await (await getSql())
      .prepare(
        `SELECT u.id, u.name, u.email, u.role, u.created_at,
                (SELECT COUNT(*) FROM staff_sessions s WHERE s.staff_user_id = u.id AND s.expires_at > ?) AS active
         FROM staff_users u
         ORDER BY CASE u.role WHEN 'ADMIN' THEN 0 WHEN 'SUB_ADMIN' THEN 1 ELSE 2 END, u.name`,
      )
      .all(new Date().toISOString())) as Record<string, unknown>[];
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: row.role as StaffRole,
      createdAt: String(row.created_at),
      activeSessions: Number(row.active ?? 0),
    }));
  } catch (error) {
    console.error("[staff-team.ts:listTeam]", error instanceof Error ? error.message : error);
    return { error: "Could not load the team." };
  }
}

/** Loads the target and refuses anything that would touch the actor or the Admin account. */
async function editableTarget(actorId: string, targetId: string): Promise<{ role: StaffRole } | { error: string }> {
  if (!ID_OK.test(targetId)) return { error: "Unknown staff account." };
  if (targetId === actorId) return { error: "You cannot change your own access here." };
  const row = (await (await getSql()).prepare(`SELECT role FROM staff_users WHERE id = ?`).get(targetId)) as
    | { role: StaffRole }
    | undefined;
  if (!row) return { error: "Staff account not found." };
  if (row.role === "ADMIN") return { error: "The Admin account cannot be changed here." };
  return { role: row.role };
}

export async function changeStaffRole(
  actorId: string,
  targetId: string,
  role: AssignableRole,
): Promise<{ ok: true } | { error: string }> {
  try {
    if (!isAssignableRole(role)) return { error: "Choose Editor or Sub-admin." };
    const target = await editableTarget(actorId, targetId);
    if ("error" in target) return target;
    if (target.role === role) return { ok: true };
    const db = await getSql();
    const held = (await db.prepare(`SELECT COUNT(*) AS c FROM staff_users WHERE role = ?`).get(role)) as { c: number };
    if (Number(held.c) >= STAFF_LIMITS[role]) {
      return { error: `${ROLE_LABELS[role]} limit is ${STAFF_LIMITS[role]}. Remove one first.` };
    }
    await db.prepare(`UPDATE staff_users SET role = ? WHERE id = ?`).run(role, targetId);
    return { ok: true };
  } catch (error) {
    console.error("[staff-team.ts:changeStaffRole]", error instanceof Error ? error.message : error);
    return { error: "Could not change the role." };
  }
}

/** Signs the person out everywhere and deletes their staff account. */
export async function removeStaffAccess(actorId: string, targetId: string): Promise<{ ok: true } | { error: string }> {
  try {
    const target = await editableTarget(actorId, targetId);
    if ("error" in target) return target;
    await (await getSql()).transaction(async (tx) => {
      await tx.prepare(`DELETE FROM staff_sessions WHERE staff_user_id = ?`).run(targetId);
      await tx.prepare(`DELETE FROM staff_users WHERE id = ?`).run(targetId);
    });
    return { ok: true };
  } catch (error) {
    console.error("[staff-team.ts:removeStaffAccess]", error instanceof Error ? error.message : error);
    return { error: "Could not remove access." };
  }
}
