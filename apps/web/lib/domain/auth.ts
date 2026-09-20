import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  accountType: z.enum(["INDIVIDUAL", "BUSINESS"]),
  organizationName: z.string().trim().min(2).max(120).optional(),
});

export const signinSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;

export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, 12);
  } catch (error) {
    console.error(
      "[auth.ts:hashPassword] Hash failed:",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not secure password.");
  }
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch (error) {
    console.error(
      "[auth.ts:verifyPassword] Compare failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiryIso(days = 14): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires.toISOString();
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}
