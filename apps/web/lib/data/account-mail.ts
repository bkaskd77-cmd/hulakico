import { sendCustomerEmail } from "@/lib/data/customer-mail";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://hulakico.com").replace(/\/+$/, "");
}

function greeting(name: string): string {
  return `Hello ${name.replace(/[\r\n]+/g, " ").trim().slice(0, 80) || "there"},`;
}

/** Password reset link, valid 30 minutes. */
export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<{ ok: true } | { error: string }> {
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return sendCustomerEmail({
    to,
    subject: "Reset your Hulakico password",
    text: [greeting(name), "", "Someone asked to reset the password for your Hulakico account.", "", `Choose a new password: ${link}`, "", "The link works once and expires in 30 minutes. If you did not ask for this, ignore this email; your password stays the same.", "", "Hulakico Logistics"].join("\n"),
  });
}

/** Email verification link, valid 24 hours. */
export async function sendVerifyEmail(to: string, name: string, token: string): Promise<{ ok: true } | { error: string }> {
  const link = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return sendCustomerEmail({
    to,
    subject: "Confirm your email for Hulakico",
    text: [greeting(name), "", "Confirm this email address to start booking shipments with Hulakico.", "", `Confirm your email: ${link}`, "", "The link expires in 24 hours.", "", "Hulakico Logistics"].join("\n"),
  });
}
