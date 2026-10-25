import { getSql } from "@/lib/sql";
import { matchTotpStep, newTotpSecret } from "@/lib/domain/totp";

type TotpRow = { totp_secret: string | null; totp_enabled_at: string | null; totp_last_step: number | null };

async function loadTotp(staffId: string): Promise<TotpRow | undefined> {
  return (await (await getSql())
    .prepare(`SELECT totp_secret, totp_enabled_at, totp_last_step FROM staff_users WHERE id = ?`)
    .get(staffId)) as TotpRow | undefined;
}

/** True once the staff member has finished setting up their authenticator app. */
export async function staffHasTwoStep(staffId: string): Promise<boolean> {
  try {
    return Boolean((await loadTotp(staffId))?.totp_enabled_at);
  } catch (error) {
    console.error("[staff-totp.ts:staffHasTwoStep]", error instanceof Error ? error.message : error);
    return false;
  }
}

/** Starts setup: stores a new secret (not active yet) and returns it for the app. */
export async function beginTwoStepSetup(staffId: string): Promise<{ secret: string } | { error: string }> {
  try {
    const row = await loadTotp(staffId);
    if (!row) return { error: "Staff account not found." };
    if (row.totp_enabled_at) return { error: "Two-step login is already on." };
    if (row.totp_secret) return { secret: row.totp_secret };
    const secret = newTotpSecret();
    await (await getSql()).prepare(`UPDATE staff_users SET totp_secret = ? WHERE id = ?`).run(secret, staffId);
    return { secret };
  } catch (error) {
    console.error("[staff-totp.ts:beginTwoStepSetup]", error instanceof Error ? error.message : error);
    return { error: "Could not start two-step setup." };
  }
}

/**
 * Checks a 6-digit code and records its time step, so the same code cannot be used twice.
 * During setup (`activate`), a correct code also turns two-step login on.
 */
export async function checkStaffCode(staffId: string, code: string, activate = false): Promise<boolean> {
  try {
    const row = await loadTotp(staffId);
    if (!row?.totp_secret) return false;
    if (!activate && !row.totp_enabled_at) return false;
    const step = matchTotpStep(row.totp_secret, code);
    if (step === null || (row.totp_last_step !== null && step <= Number(row.totp_last_step))) return false;
    const result = await (await getSql())
      .prepare(
        `UPDATE staff_users SET totp_last_step = ?, totp_enabled_at = COALESCE(totp_enabled_at, ?)
         WHERE id = ? AND (totp_last_step IS NULL OR totp_last_step < ?)`,
      )
      .run(step, new Date().toISOString(), staffId, step);
    return Boolean(result.changes);
  } catch (error) {
    console.error("[staff-totp.ts:checkStaffCode]", error instanceof Error ? error.message : error);
    return false;
  }
}
