import { getTurso, type SqlClient } from "@/lib/turso";
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

export async function createSession(db: SqlClient, userId: string): Promise<string> {
  const sessionToken = createSessionToken();
  await db.execute({
    sql: `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      newId("ses"),
      userId,
      hashSessionToken(sessionToken),
      sessionExpiryIso(),
      new Date().toISOString(),
    ],
  });
  return sessionToken;
}

export async function toPublicUser(db: SqlClient, row: UserRow): Promise<PublicUser> {
  const result = await db.execute({
    sql: `SELECT m.role, o.id AS org_id, o.name AS org_name
          FROM memberships m
          JOIN organizations o ON o.id = m.organization_id
          WHERE m.user_id = ?
          LIMIT 1`,
    args: [row.id],
  });
  const membership = result.rows[0] as unknown as
    | { role: string; org_id: string; org_name: string }
    | undefined;
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
    const db = await getTurso();
    const result = await db.execute({
      sql: `SELECT u.id, u.email, u.password_hash, u.name, u.account_type
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = ? AND s.expires_at > ?`,
      args: [hashSessionToken(token), new Date().toISOString()],
    });
    const row = result.rows[0] as unknown as UserRow | undefined;
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
    const db = await getTurso();
    await db.execute({
      sql: "DELETE FROM sessions WHERE token_hash = ?",
      args: [hashSessionToken(token)],
    });
  } catch (error) {
    console.error(
      "[auth-sessions.ts:destroySession]",
      error instanceof Error ? error.message : error,
    );
  }
}
