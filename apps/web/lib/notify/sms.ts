/**
 * Nepal SMS gateways, chosen with SMS_PROVIDER (sparrow | aakash) and SMS_TOKEN.
 * Sparrow also needs SMS_FROM (the approved sender identity). Nepal numbers only, as
 * 10-digit mobiles (98XXXXXXXX); foreign numbers go by WhatsApp or email instead.
 */
const SEND_TIMEOUT_MS = 8000;

type Provider = "sparrow" | "aakash";

function provider(): Provider | null {
  const value = process.env.SMS_PROVIDER?.trim().toLowerCase();
  return value === "sparrow" || value === "aakash" ? value : null;
}

export function smsEnabled(): boolean {
  const name = provider();
  if (!name || !process.env.SMS_TOKEN?.trim()) return false;
  return name === "aakash" || Boolean(process.env.SMS_FROM?.trim());
}

/** 98XXXXXXXX from +977 98XXXXXXXX, or null when it is not a Nepal mobile. */
export function nepalMobile(e164: string): string | null {
  const digits = e164.replace(/\D/g, "");
  const local = digits.startsWith("977") ? digits.slice(3) : digits;
  return /^9[678]\d{8}$/.test(local) ? local : null;
}

function request(name: Provider, to: string, text: string): { url: string; body: URLSearchParams } {
  const token = process.env.SMS_TOKEN!.trim();
  if (name === "sparrow") {
    return { url: "https://api.sparrowsms.com/v2/sms/", body: new URLSearchParams({ token, from: process.env.SMS_FROM!.trim(), to, text }) };
  }
  // Aakash SMS v3 (confirm against the account's API page before switching it on).
  return { url: "https://sms.aakashsms.com/sms/v3/send", body: new URLSearchParams({ auth_token: token, to, text }) };
}

export async function sendSms(e164: string, text: string): Promise<{ ok: true; provider: Provider } | { error: string }> {
  const name = provider();
  if (!name || !smsEnabled()) return { error: "SMS is not configured." };
  const to = nepalMobile(e164);
  if (!to) return { error: "SMS goes to Nepal mobile numbers only." };
  try {
    const { url, body } = request(name, to, text.slice(0, 480));
    const response = await fetch(url, { method: "POST", body, signal: AbortSignal.timeout(SEND_TIMEOUT_MS) });
    if (!response.ok) {
      console.error("[sms.ts:sendSms]", name, response.status, (await response.text()).slice(0, 200));
      return { error: `SMS gateway returned ${response.status}.` };
    }
    return { ok: true, provider: name };
  } catch (error) {
    console.error("[sms.ts:sendSms]", name, error instanceof Error ? error.message : error);
    return { error: "Could not reach the SMS gateway." };
  }
}
