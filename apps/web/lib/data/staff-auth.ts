import { getSql } from "@/lib/sql";
import {
  createSessionToken,
  hashSessionToken,
  newId,
  sessionExpiryIso,
  verifyPassword,
} from "@/lib/domain/auth";

export type StaffRole = "ADMIN" | "EDITOR" | "SUB_ADMIN";

export type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
};

type StaffRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: StaffRole;
};

export async function authenticateStaff(
  email: string,
  password: string,
): Promise<{ staff: StaffUser; sessionToken: string } | null> {
  try {
    const db = await getSql();
    const row = (await db
      .prepare(
        `SELECT id, email, password_hash, name, role FROM staff_users WHERE email = ?`,
      )
      .get(email.toLowerCase())) as StaffRow | undefined;
    if (!row) return null;

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) return null;

    const sessionToken = createSessionToken();
    const now = new Date().toISOString();
    await db.prepare(
      `INSERT INTO staff_sessions (id, staff_user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      newId("sses"),
      row.id,
      hashSessionToken(sessionToken),
      sessionExpiryIso(),
      now,
    );

    return {
      sessionToken,
      staff: {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
      },
    };
  } catch (error) {
    console.error(
      "[staff-auth.ts:authenticateStaff]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Staff sign in failed.");
  }
}

export async function getStaffBySessionToken(
  token: string,
): Promise<StaffUser | null> {
  try {
    const now = new Date().toISOString();
    const row = (await (await getSql())
      .prepare(
        `SELECT u.id, u.email, u.name, u.role
         FROM staff_sessions s
         JOIN staff_users u ON u.id = s.staff_user_id
         WHERE s.token_hash = ? AND s.expires_at > ?`,
      )
      .get(hashSessionToken(token), now)) as
      | { id: string; email: string; name: string; role: StaffRole }
      | undefined;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
    };
  } catch (error) {
    console.error(
      "[staff-auth.ts:getStaffBySessionToken]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function destroyStaffSession(token: string): Promise<void> {
  try {
    await (await getSql())
      .prepare("DELETE FROM staff_sessions WHERE token_hash = ?")
      .run(hashSessionToken(token));
  } catch (error) {
    console.error(
      "[staff-auth.ts:destroyStaffSession]",
      error instanceof Error ? error.message : error,
    );
  }
}
