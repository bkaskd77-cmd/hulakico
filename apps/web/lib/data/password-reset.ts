import { getSql } from "@/lib/sql";
import { hashPassword } from "@/lib/domain/auth";
import { consumeUserToken, issueUserToken } from "@/lib/data/user-tokens";
import { sendPasswordResetEmail } from "@/lib/data/account-mail";

const RESET_MINUTES = 30;

/**
 * Emails a reset link when the address belongs to a customer account. Staff accounts are
 * excluded (their passwords are reset by the Admin). Callers always answer the same way.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    const db = await getSql();
    const row = (await db
      .prepare(`SELECT id, name FROM users WHERE email = ? AND platform_role = 'CUSTOMER'`)
      .get(email.trim().toLowerCase())) as { id: string; name: string } | undefined;
    if (!row) return;
    const token = await issueUserToken(row.id, "RESET_PASSWORD", RESET_MINUTES);
    const sent = await sendPasswordResetEmail(email.trim().toLowerCase(), row.name, token);
    if ("error" in sent) console.error("[password-reset.ts:requestPasswordReset]", sent.error);
  } catch (error) {
    console.error("[password-reset.ts:requestPasswordReset]", error instanceof Error ? error.message : error);
  }
}

/** Sets a new password from a reset link and signs the account out on every device. */
export async function resetPassword(token: string, password: string): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await consumeUserToken(token, "RESET_PASSWORD");
    if (!userId) return { error: "This reset link is invalid or has expired. Ask for a new one." };
    const passwordHash = await hashPassword(password);
    const db = await getSql();
    await db.transaction(async (tx) => {
      await tx.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(passwordHash, userId);
      await tx.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
    });
    return { ok: true };
  } catch (error) {
    console.error("[password-reset.ts:resetPassword]", error instanceof Error ? error.message : error);
    return { error: "Could not reset the password. Please try again." };
  }
}
