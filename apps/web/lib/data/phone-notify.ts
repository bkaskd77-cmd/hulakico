import { normalizePhone } from "@/app/book/countries";
import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import { ensureNotificationsTable } from "@/lib/data/notifications";
import { phoneLanguage, phoneLine, smsText, type PhoneEvent } from "@/lib/notify/phone-messages";
import { sendSms, smsEnabled } from "@/lib/notify/sms";
import { sendWhatsAppUpdate, whatsappEnabled } from "@/lib/notify/whatsapp";

type Row = {
  user_id: string; hulakico_awb: string | null; tracking_token: string | null;
  origin_phone: string | null; origin_country: string; destination_phone: string | null; destination_country: string;
};

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://hulakico.com").replace(/\/+$/, "");
}

/** Production only, and only when a WhatsApp or SMS account is set up. */
export function phoneNotifyEnabled(): boolean {
  return process.env.NODE_ENV === "production" && (whatsappEnabled() || smsEnabled());
}

/**
 * Sends one phone update (WhatsApp first, SMS as fallback) to the sender or receiver and logs it.
 * The same event goes to the same number once. Never throws: email is the main channel.
 */
export async function notifyByPhone(shipmentId: string, event: PhoneEvent): Promise<void> {
  if (!phoneNotifyEnabled()) return;
  try {
    await ensureNotificationsTable();
    const db = await getSql();
    const row = (await db
      .prepare(`SELECT user_id, hulakico_awb, tracking_token, origin_phone, origin_country, destination_phone, destination_country FROM shipments WHERE id = ?`)
      .get(shipmentId)) as Row | undefined;
    if (!row?.hulakico_awb || !row.tracking_token) return;
    const toReceiver = event.startsWith("RECEIVER_");
    const raw = toReceiver ? row.destination_phone : row.origin_phone;
    const phone = raw ? normalizePhone(raw, toReceiver ? row.destination_country : row.origin_country).replace(/\s/g, "") : "";
    if (!/^\+\d{8,15}$/.test(phone)) return;
    // One person on both ends (sending to themselves) gets the sender message only.
    if (toReceiver && row.origin_phone && normalizePhone(row.origin_phone, row.origin_country).replace(/\s/g, "") === phone) return;
    const already = await db
      .prepare(`SELECT 1 FROM outbound_notifications WHERE shipment_id = ? AND channel = 'SMS' AND kind = ? AND recipient = ? AND status = 'SENT'`)
      .get(shipmentId, event, phone);
    if (already) return;

    const language = phoneLanguage(phone);
    const trackUrl = `${appUrl()}/track/${row.tracking_token}`;
    let provider = "none";
    let status: "SENT" | "FAILED" = "FAILED";
    let body = phoneLine(event, language);
    if (whatsappEnabled()) {
      const sent = await sendWhatsAppUpdate({ to: phone, language, line: body, awb: row.hulakico_awb, trackUrl });
      provider = "whatsapp";
      if ("ok" in sent) status = "SENT";
    }
    if (status === "FAILED" && smsEnabled()) {
      body = smsText(event, language, row.hulakico_awb, trackUrl);
      const sent = await sendSms(phone, body);
      if ("ok" in sent) { status = "SENT"; provider = sent.provider; }
    }
    await db
      .prepare(
        `INSERT INTO outbound_notifications (id, shipment_id, user_id, channel, kind, recipient, subject, body, provider, status, created_at)
         VALUES (?, ?, ?, 'SMS', ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(newId("ntf"), shipmentId, row.user_id, event, phone, toReceiver ? "Receiver update" : "Sender update", body, provider, status, new Date().toISOString());
  } catch (error) {
    console.error("[phone-notify.ts:notifyByPhone]", event, error instanceof Error ? error.message : error);
  }
}
