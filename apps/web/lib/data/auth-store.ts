import { getSql } from "@/lib/sql";
import {
  hashPassword,
  newId,
  type SignupInput,
  verifyPassword,
} from "@/lib/domain/auth";
import {
  createSession,
  toPublicUser,
  type PublicUser,
  type UserRow,
} from "@/lib/data/auth-sessions";

export type { PublicUser } from "@/lib/data/auth-sessions";
export { getUserBySessionToken, destroySession } from "@/lib/data/auth-sessions";

export async function registerUser(input: SignupInput): Promise<PublicUser> {
  try {
    if (input.accountType === "BUSINESS" && !input.organizationName) {
      throw new Error("Organization name is required for business accounts.");
    }

    const db = await getSql();
    const email = input.email.toLowerCase();
    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const userId = newId("usr");
    const passwordHash = await hashPassword(input.password);
    const createdAt = new Date().toISOString();
    let organization: PublicUser["organization"] = null;

    try {
      await db.transaction(async (tx) => {
        await tx
          .prepare(
            `INSERT INTO users (id, email, password_hash, name, account_type, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(userId, email, passwordHash, input.name, input.accountType, createdAt);
        if (input.accountType === "BUSINESS" && input.organizationName) {
          const orgId = newId("org");
          await tx
            .prepare("INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)")
            .run(orgId, input.organizationName, createdAt);
          await tx
            .prepare(
              `INSERT INTO memberships (id, user_id, organization_id, role)
               VALUES (?, ?, ?, ?)`,
            )
            .run(newId("mem"), userId, orgId, "OWNER");
          organization = { id: orgId, name: input.organizationName, role: "OWNER" };
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("UNIQUE")) {
        throw new Error("An account with this email already exists.");
      }
      throw error;
    }

    return { id: userId, email, name: input.name, accountType: input.accountType, organization };
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
    const db = await getSql();
    const row = (await db
      .prepare(`SELECT id, email, password_hash, name, account_type FROM users WHERE email = ?`)
      .get(email.toLowerCase())) as UserRow | undefined;
    if (!row) return null;

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) return null;

    const sessionToken = await createSession(db, row.id);
    return { sessionToken, user: await toPublicUser(db, row) };
  } catch (error) {
    console.error(
      "[auth-store.ts:authenticateUser]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Sign in failed.");
  }
}
