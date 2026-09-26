import { cache } from "react";
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

export const getUserBySessionToken = cache(async (token: string): Promise<PublicUser | null> => {
  try {
    const db = await getSql();
    const row = (await db
      .prepare(
        `SELECT u.id, u.email, u.name, u.account_type,
                m.role AS org_role, o.id AS org_id, o.name AS org_name
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         LEFT JOIN memberships m ON m.user_id = u.id
         LEFT JOIN organizations o ON o.id = m.organization_id
         WHERE s.token_hash = ? AND s.expires_at > ?
         LIMIT 1`,
      )
      .get(hashSessionToken(token), new Date().toISOString())) as
      | (Omit<UserRow, "password_hash"> & {
          org_role: string | null;
          org_id: string | null;
          org_name: string | null;
        })
      | undefined;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      accountType: row.account_type,
      organization:
        row.org_id && row.org_name && row.org_role
          ? { id: row.org_id, name: row.org_name, role: row.org_role }
          : null,
    };
  } catch (error) {
    console.error(
      "[auth-sessions.ts:getUserBySessionToken]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
});

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
