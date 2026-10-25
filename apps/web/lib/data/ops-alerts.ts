import { sendCustomerEmail } from "@/lib/data/customer-mail";

/** Same alert kind at most once per window, so an outage sends one email, not hundreds. */
const WINDOW_MS = 30 * 60 * 1000;
const lastSent = new Map<string, number>();

function alertRecipient(): string | null {
  const to = (process.env.OPS_ALERT_EMAIL ?? process.env.STAFF_BOOTSTRAP_EMAIL ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ? to : null;
}

function clean(text: string, max: number): string {
  // Strip anything token-like so secrets never leave in an alert.
  return text.replace(/(bearer|token|key|secret|password)[=: ]+\S+/gi, "$1=[hidden]").slice(0, max);
}

/**
 * Emails the site owner about a server problem (unhandled error, health check failure).
 * Throttled per kind; never throws. Set OPS_ALERT_EMAIL in .env.production to choose the inbox.
 */
export async function sendOpsAlert(kind: string, subject: string, detail: string): Promise<void> {
  try {
    if (process.env.NODE_ENV !== "production") return;
    const to = alertRecipient();
    if (!to) {
      console.error("[ops-alerts.ts:sendOpsAlert] OPS_ALERT_EMAIL is not set; alert not sent:", kind);
      return;
    }
    const now = Date.now();
    if (now - (lastSent.get(kind) ?? 0) < WINDOW_MS) return;
    lastSent.set(kind, now);
    const when = new Date(now).toLocaleString("en-GB", { timeZone: "Asia/Kathmandu" });
    const sent = await sendCustomerEmail({
      to,
      subject: `[Hulakico alert] ${clean(subject, 120)}`,
      text: [`${clean(detail, 2000)}`, "", `Time: ${when} (Nepal)`, "Further alerts of this kind are paused for 30 minutes.", "", "Hulakico server"].join("\n"),
    });
    if ("error" in sent) console.error("[ops-alerts.ts:sendOpsAlert]", sent.error);
  } catch (error) {
    console.error("[ops-alerts.ts:sendOpsAlert]", error instanceof Error ? error.message : error);
  }
}
