import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";

export type AuditEntry = {
  id: string;
  staffEmail: string;
  action: string;
  target: string | null;
  detail: string | null;
  ip: string | null;
  createdAt: string;
};

type AuditActor = { id: string | null; email: string };

function clip(value: string | null | undefined, max: number): string | null {
  const clean = (value ?? "").replace(/[\r\n\t]+/g, " ").trim();
  return clean ? clean.slice(0, max) : null;
}

/**
 * Records who did what in Admin (e.g. "rate.update", "shipment.cancel"). Never blocks the
 * action itself: a failed write is logged to the console and the caller carries on.
 * Never pass passwords, codes, or tokens in `detail`.
 */
export async function writeAudit(
  actor: AuditActor,
  action: string,
  target?: string | null,
  detail?: string | null,
  ip?: string | null,
): Promise<void> {
  try {
    await (await getSql())
      .prepare(
        `INSERT INTO audit_log (id, staff_user_id, staff_email, action, target, detail, ip, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(newId("aud"), actor.id, actor.email.slice(0, 120), action.slice(0, 60), clip(target, 120), clip(detail, 300), clip(ip, 60), new Date().toISOString());
  } catch (error) {
    console.error("[audit-log.ts:writeAudit]", action, error instanceof Error ? error.message : error);
  }
}

/** Newest first, for the Team page. */
export async function listAudit(limit = 100): Promise<AuditEntry[] | { error: string }> {
  try {
    const rows = (await (await getSql())
      .prepare(
        `SELECT id, staff_email, action, target, detail, ip, created_at FROM audit_log
         ORDER BY created_at DESC LIMIT ?`,
      )
      .all(Math.min(Math.max(limit, 1), 500))) as Array<{
      id: string; staff_email: string; action: string; target: string | null;
      detail: string | null; ip: string | null; created_at: string;
    }>;
    return rows.map((row) => ({
      id: row.id,
      staffEmail: row.staff_email,
      action: row.action,
      target: row.target,
      detail: row.detail,
      ip: row.ip,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error("[audit-log.ts:listAudit]", error instanceof Error ? error.message : error);
    return { error: "Could not load the activity log." };
  }
}
