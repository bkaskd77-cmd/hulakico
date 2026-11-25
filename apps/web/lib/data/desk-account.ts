import { randomBytes } from "node:crypto";
import { getSql } from "@/lib/sql";
import { hashPassword, newId } from "@/lib/domain/auth";
import { createSession } from "@/lib/data/auth-sessions";
import { getCompanyContact } from "@/lib/data/company-contact-content";

export const DESK_NAME = "Hulakico Desk";

/**
 * The internal account that owns bookings staff make for customers who send their details by
 * email or walk in. It uses the company inbox, so booking emails reach the desk, and its
 * password is random and never shown, so nobody signs in to it from the public sign-in page.
 */
export async function ensureDeskUser(): Promise<string> {
  const db = await getSql();
  const email = (await getCompanyContact()).email.toLowerCase();
  const existing = (await db.prepare("SELECT id FROM users WHERE email = ?").get(email)) as { id: string } | undefined;
  if (existing) return existing.id;
  const id = newId("usr");
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, name, account_type, created_at, email_verified_at)
       VALUES (?, ?, ?, ?, 'BUSINESS', ?, ?)`,
    )
    .run(id, email, await hashPassword(randomBytes(32).toString("base64url")), DESK_NAME, now, now);
  return id;
}

/** A booking session for the desk account; only reachable through Admin by operations staff. */
export async function startDeskSession(): Promise<{ token: string } | { error: string }> {
  try {
    const userId = await ensureDeskUser();
    return { token: await createSession(await getSql(), userId) };
  } catch (error) {
    console.error("[desk-account.ts:startDeskSession]", error instanceof Error ? error.message : error);
    return { error: "Could not open the desk booking. Try again." };
  }
}
