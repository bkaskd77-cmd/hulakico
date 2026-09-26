import { getSql } from "@/lib/sql";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  newId,
  sessionExpiryIso,
} from "@/lib/domain/auth";
import type { StaffRole, StaffUser } from "@/lib/data/staff-auth";

export async function registerStaff(input: {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
}): Promise<{ staff: StaffUser; sessionToken: string } | { error: string }> {
  try {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (name.length < 2) return { error: "Name must be at least 2 characters." };
    if (input.password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }
    if (!["ADMIN", "EDITOR", "SUB_ADMIN"].includes(input.role)) {
      return { error: "Invalid staff role." };
    }

    const db = await getSql();
    const existing = await db
      .prepare(`SELECT id FROM staff_users WHERE email = ?`)
      .get(email);
    if (existing) {
      return { error: "A staff account with this email already exists." };
    }

    const id = newId("stf");
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(input.password);
    await db.prepare(
      `INSERT INTO staff_users (id, email, password_hash, name, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, email, passwordHash, name, input.role, now);

    const sessionToken = createSessionToken();
    await db.prepare(
      `INSERT INTO staff_sessions (id, staff_user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      newId("sses"),
      id,
      hashSessionToken(sessionToken),
      sessionExpiryIso(),
      now,
    );

    return {
      sessionToken,
      staff: { id, email, name, role: input.role },
    };
  } catch (error) {
    console.error(
      "[staff-register.ts:registerStaff]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Staff registration failed." };
  }
}
