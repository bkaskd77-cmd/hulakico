import { getCompanyContact } from "@/lib/data/company-contact-content";

// Sent from the Resend-verified hulakico.com domain.
const DEFAULT_FROM = "Hulakico <info@hulakico.com>";
const SEND_TIMEOUT_MS = 8000;

/** Real customer email only when explicitly switched on, so local and test runs never mail customers. */
export function customerEmailEnabled(): boolean {
  return process.env.NOTIFY_EMAIL?.trim() === "live" && Boolean(process.env.RESEND_API_KEY?.trim());
}

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 200);
}

function appUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://hulakico.com";
  return raw.replace(/\/+$/, "");
}

/** Plain-text body: greeting, the notice, AWB, tracking link, and how to reach us. */
export async function composeCustomerEmail(input: {
  name: string;
  body: string;
  hulakicoAwb: string | null;
  trackingToken: string | null;
}): Promise<string> {
  const contact = await getCompanyContact();
  const phone = contact.phones[0]?.display;
  return [
    `Hello ${oneLine(input.name) || "there"},`,
    "",
    input.body.trim(),
    "",
    input.hulakicoAwb ? `Hulakico AWB: ${input.hulakicoAwb}` : "",
    input.trackingToken ? `Track your shipment: ${appUrl()}/track/${encodeURIComponent(input.trackingToken)}` : "",
    "",
    "Questions? Reply to this email" + (phone ? ` or call ${phone}.` : "."),
    "",
    "Hulakico Logistics",
    appUrl(),
  ].filter((line, index, all) => line !== "" || (all[index - 1] ?? "") !== "").join("\n").trim();
}

/** Sends one plain-text email through Resend. Never throws; times out after 8 seconds. */
export async function sendCustomerEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { error: string }> {
  const token = process.env.RESEND_API_KEY?.trim();
  if (!token) return { error: "RESEND_API_KEY is not set." };
  try {
    const replyTo = (await getCompanyContact()).email;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL?.trim() || DEFAULT_FROM,
        to: [input.to],
        reply_to: replyTo,
        subject: oneLine(input.subject),
        text: input.text,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 240);
      console.error("[customer-mail.ts:sendCustomerEmail]", response.status, detail);
      return { error: `Resend returned ${response.status}.` };
    }
    return { ok: true };
  } catch (error) {
    console.error("[customer-mail.ts:sendCustomerEmail]", error instanceof Error ? error.message : error);
    return { error: "Could not reach the email service." };
  }
}
