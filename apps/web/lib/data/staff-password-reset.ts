import { hashPassword } from "@/lib/domain/auth";
import type { Sql } from "@/lib/sql";

let applied = false;
const PREVIOUS_EMAIL = "bkaskd@gmail.com";

type IdRow = { id: string };

/** One-time reset when STAFF_RESET_PASSWORD=1. Moves the admin login to the bootstrap email. */
export async function applyStaffPasswordReset(db: Sql): Promise<void> {
  if (applied || process.env.STAFF_RESET_PASSWORD !== "1") return;
  const email = process.env.STAFF_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.STAFF_BOOTSTRAP_PASSWORD?.trim();
  if (!email || !password || password.length < 8) {
    console.error(
      "[staff-password-reset.ts:applyStaffPasswordReset] Set STAFF_BOOTSTRAP_EMAIL and STAFF_BOOTSTRAP_PASSWORD (8+ characters).",
    );
    return;
  }
  applied = true;
  try {
    const hash = await hashPassword(password);
    const current = (await db
      .prepare("SELECT id FROM staff_users WHERE lower(email) = ?")
      .get(email)) as IdRow | undefined;
    if (current) {
      await db.prepare("UPDATE staff_users SET password_hash = ? WHERE id = ?").run(hash, current.id);
      console.info("[staff-password-reset.ts:applyStaffPasswordReset] Staff password updated.");
      return;
    }
    const previous = (await db
      .prepare(
        `SELECT id FROM staff_users
         WHERE lower(email) = ? OR role = 'ADMIN'
         ORDER BY CASE WHEN lower(email) = ? THEN 0 ELSE 1 END, created_at
         LIMIT 1`,
      )
      .get(PREVIOUS_EMAIL, PREVIOUS_EMAIL)) as IdRow | undefined;
    if (!previous) {
      console.error("[staff-password-reset.ts:applyStaffPasswordReset] No staff account to update.");
      return;
    }
    await db
      .prepare("UPDATE staff_users SET email = ?, password_hash = ? WHERE id = ?")
      .run(email, hash, previous.id);
    console.info("[staff-password-reset.ts:applyStaffPasswordReset] Staff login email and password updated.");
  } catch (error) {
    applied = false;
    console.error(
      "[staff-password-reset.ts:applyStaffPasswordReset]",
      error instanceof Error ? error.message : error,
    );
  }
}
