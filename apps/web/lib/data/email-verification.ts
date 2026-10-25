import { getSql } from "@/lib/sql";
import { consumeUserToken, issueUserToken, VERIFICATION_START } from "@/lib/data/user-tokens";
import { sendVerifyEmail } from "@/lib/data/account-mail";

const VERIFY_MINUTES = 24 * 60;

type VerifyRow = { email: string; name: string; email_verified_at: string | null; created_at: string };

async function loadUser(userId: string): Promise<VerifyRow | undefined> {
  const db = await getSql();
  return (await db
    .prepare(`SELECT email, name, email_verified_at, created_at FROM users WHERE id = ?`)
    .get(userId)) as VerifyRow | undefined;
}

function counted(row: VerifyRow): boolean {
  return Boolean(row.email_verified_at) || row.created_at < VERIFICATION_START;
}

/** True when the customer confirmed their email, or signed up before verification existed. */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const row = await loadUser(userId);
    return row ? counted(row) : false;
  } catch (error) {
    console.error("[email-verification.ts:isEmailVerified]", error instanceof Error ? error.message : error);
    return false;
  }
}

/** Emails a fresh 24-hour verification link. Already-verified accounts get nothing. */
export async function sendEmailVerification(userId: string): Promise<{ ok: true } | { error: string }> {
  try {
    const row = await loadUser(userId);
    if (!row) return { error: "Account not found." };
    if (counted(row)) return { ok: true };
    const token = await issueUserToken(userId, "VERIFY_EMAIL", VERIFY_MINUTES);
    const sent = await sendVerifyEmail(row.email, row.name, token);
    if ("error" in sent) {
      console.error("[email-verification.ts:sendEmailVerification]", sent.error);
      return { error: "Could not send the verification email. Please try again later." };
    }
    return { ok: true };
  } catch (error) {
    console.error("[email-verification.ts:sendEmailVerification]", error instanceof Error ? error.message : error);
    return { error: "Could not send the verification email. Please try again later." };
  }
}

/** Marks the email as confirmed from a verification link. */
export async function confirmEmail(token: string): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await consumeUserToken(token, "VERIFY_EMAIL");
    if (!userId) return { error: "This link is invalid or has expired." };
    const db = await getSql();
    await db
      .prepare(`UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?`)
      .run(new Date().toISOString(), userId);
    return { ok: true };
  } catch (error) {
    console.error("[email-verification.ts:confirmEmail]", error instanceof Error ? error.message : error);
    return { error: "Could not confirm the email. Please try again." };
  }
}
