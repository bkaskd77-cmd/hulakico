import { getSql, type Sql } from "@/lib/sql";
import {
  createSessionToken,
  hashSessionToken,
  newId,
  sessionExpiryIso,
} from "@/lib/domain/auth";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  accountType: "INDIVIDUAL" | "BUSINESS";
  organization: { id: string; name: string; role: string } | null;
};

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  account_type: "INDIVIDUAL" | "BUSINESS";
};

export async function createSession(db: Sql, userId: string): Promise<string> {
  const sessionToken = createSessionToken();
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      newId("ses"),
      userId,
      hashSessionToken(sessionToken),
      sessionExpiryIso(),
      new Date().toISOString(),
    );
  return sessionToken;
}

export async function toPublicUser(db: Sql, row: UserRow): Promise<PublicUser> {
  const membership = (await db
    .prepare(
      `SELECT m.role, o.id AS org_id, o.name AS org_name
       FROM memberships m
       JOIN organizations o ON o.id = m.organization_id
       WHERE m.user_id = ?
       LIMIT 1`,
    )
    .get(row.id)) as { role: string; org_id: string; org_name: string } | undefined;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    accountType: row.account_type,
    organization: membership
      ? { id: membership.org_id, name: membership.org_name, role: membership.role }
      : null,
  };
}

export async function getUserBySessionToken(token: string): Promise<PublicUser | null> {
  try {
    const db = await getSql();
    const row = (await db
      .prepare(
        `SELECT u.id, u.email, u.password_hash, u.name, u.account_type
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?`,
      )
      .get(hashSessionToken(token), new Date().toISOString())) as UserRow | undefined;
    if (!row) return null;
    return await toPublicUser(db, row);
  } catch (error) {
    console.error(
      "[auth-sessions.ts:getUserBySessionToken]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function destroySession(token: string): Promise<void> {
  try {
    const db = await getSql();
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSessionToken(token));
  } catch (error) {
    console.error(
      "[auth-sessions.ts:destroySession]",
      error instanceof Error ? error.message : error,
    );
  }
}
