import { getDb } from "@/lib/db";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  newId,
  sessionExpiryIso,
  type SignupInput,
  verifyPassword,
} from "@/lib/domain/auth";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  accountType: "INDIVIDUAL" | "BUSINESS";
  organization: { id: string; name: string; role: string } | null;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  account_type: "INDIVIDUAL" | "BUSINESS";
};

export async function registerUser(
  input: SignupInput,
): Promise<{ user: PublicUser; sessionToken: string }> {
  try {
    if (input.accountType === "BUSINESS" && !input.organizationName) {
      throw new Error("Organization name is required for business accounts.");
    }

    const db = getDb();
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(input.email.toLowerCase());
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const userId = newId("usr");
    const passwordHash = await hashPassword(input.password);
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, account_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      userId,
      input.email.toLowerCase(),
      passwordHash,
      input.name,
      input.accountType,
      createdAt,
    );

    let organization: PublicUser["organization"] = null;
    if (input.accountType === "BUSINESS" && input.organizationName) {
      const orgId = newId("org");
      db.prepare(
        `INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)`,
      ).run(orgId, input.organizationName, createdAt);
      db.prepare(
        `INSERT INTO memberships (id, user_id, organization_id, role)
         VALUES (?, ?, ?, ?)`,
      ).run(newId("mem"), userId, orgId, "OWNER");
      organization = { id: orgId, name: input.organizationName, role: "OWNER" };
    }

    const sessionToken = createSessionToken();
    db.prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      newId("ses"),
      userId,
      hashSessionToken(sessionToken),
      sessionExpiryIso(),
      createdAt,
    );

    return {
      sessionToken,
      user: {
        id: userId,
        email: input.email.toLowerCase(),
        name: input.name,
        accountType: input.accountType,
        organization,
      },
    };
  } catch (error) {
    console.error(
      "[auth-store.ts:registerUser]",
      error instanceof Error ? error.message : error,
    );
    throw error instanceof Error ? error : new Error("Registration failed.");
  }
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ user: PublicUser; sessionToken: string } | null> {
  try {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT id, email, password_hash, name, account_type FROM users WHERE email = ?`,
      )
      .get(email.toLowerCase()) as UserRow | undefined;

    if (!row) {
      return null;
    }

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) {
      return null;
    }

    const sessionToken = createSessionToken();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      newId("ses"),
      row.id,
      hashSessionToken(sessionToken),
      sessionExpiryIso(),
      createdAt,
    );

    return {
      sessionToken,
      user: await toPublicUser(row),
    };
  } catch (error) {
    console.error(
      "[auth-store.ts:authenticateUser]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Sign in failed.");
  }
}

export function getUserBySessionToken(token: string): PublicUser | null {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const row = db
      .prepare(
        `SELECT u.id, u.email, u.password_hash, u.name, u.account_type
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?`,
      )
      .get(hashSessionToken(token), now) as UserRow | undefined;

    if (!row) {
      return null;
    }
    return toPublicUserSync(row);
  } catch (error) {
    console.error(
      "[auth-store.ts:getUserBySessionToken]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export function destroySession(token: string): void {
  try {
    getDb()
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .run(hashSessionToken(token));
  } catch (error) {
    console.error(
      "[auth-store.ts:destroySession]",
      error instanceof Error ? error.message : error,
    );
  }
}

function toPublicUserSync(row: UserRow): PublicUser {
  const db = getDb();
  const membership = db
    .prepare(
      `SELECT m.role, o.id as org_id, o.name as org_name
       FROM memberships m
       JOIN organizations o ON o.id = m.organization_id
       WHERE m.user_id = ?
       LIMIT 1`,
    )
    .get(row.id) as
    | { role: string; org_id: string; org_name: string }
    | undefined;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    accountType: row.account_type,
    organization: membership
      ? {
          id: membership.org_id,
          name: membership.org_name,
          role: membership.role,
        }
      : null,
  };
}

async function toPublicUser(row: UserRow): Promise<PublicUser> {
  return toPublicUserSync(row);
}
