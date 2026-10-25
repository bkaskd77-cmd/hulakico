import { randomBytes } from "node:crypto";
import { getSql } from "@/lib/sql";
import { hashSessionToken, newId } from "@/lib/domain/auth";

export type TokenPurpose = "RESET_PASSWORD" | "VERIFY_EMAIL";

/** Accounts created before email verification existed are treated as verified. */
export const VERIFICATION_START = "2026-10-25T00:00:00.000Z";

/**
 * One-time link token for a customer. Only its hash is stored; earlier unused tokens
 * for the same purpose are retired so just the newest link works.
 */
export async function issueUserToken(userId: string, purpose: TokenPurpose, ttlMinutes: number): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  const now = new Date();
  const db = await getSql();
  await db.prepare(`UPDATE user_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL`).run(now.toISOString(), userId, purpose);
  await db.prepare(
    `INSERT INTO user_tokens (id, user_id, purpose, token_hash, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)`,
  ).run(newId("utk"), userId, purpose, hashSessionToken(raw), new Date(now.getTime() + ttlMinutes * 60_000).toISOString(), now.toISOString());
  return raw;
}

/** Uses a token once. Returns its user, or null when unknown, expired, used, or for another purpose. */
export async function consumeUserToken(raw: string, purpose: TokenPurpose): Promise<string | null> {
  try {
    if (!/^[A-Za-z0-9_-]{20,100}$/.test(raw)) return null;
    const db = await getSql();
    const now = new Date().toISOString();
    const hash = hashSessionToken(raw);
    const result = await db.prepare(
      `UPDATE user_tokens SET used_at = ? WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?`,
    ).run(now, hash, purpose, now);
    if (!result.changes) return null;
    const row = (await db.prepare(`SELECT user_id FROM user_tokens WHERE token_hash = ?`).get(hash)) as { user_id: string } | undefined;
    return row?.user_id ?? null;
  } catch (error) {
    console.error("[user-tokens.ts:consumeUserToken]", error instanceof Error ? error.message : error);
    return null;
  }
}
