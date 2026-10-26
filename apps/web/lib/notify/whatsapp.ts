/**
 * WhatsApp Cloud API (Meta). Business-started messages must use an approved template; Hulakico
 * uses one template, by default "shipment_update", with three body values:
 * {{1}} the update line, {{2}} the AWB, {{3}} the tracking link. Create it in English (en)
 * and Nepali (ne) in WhatsApp Manager.
 */
const SEND_TIMEOUT_MS = 8000;

export function whatsappEnabled(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
}

export async function sendWhatsAppUpdate(input: {
  to: string;
  language: "en" | "ne";
  line: string;
  awb: string;
  trackUrl: string;
}): Promise<{ ok: true; id: string } | { error: string }> {
  if (!whatsappEnabled()) return { error: "WhatsApp is not configured." };
  const version = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!.trim();
  try {
    const response = await fetch(`https://graph.facebook.com/${encodeURIComponent(version)}/${encodeURIComponent(phoneId)}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN!.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to.replace(/\D/g, ""),
        type: "template",
        template: {
          name: process.env.WHATSAPP_TEMPLATE?.trim() || "shipment_update",
          language: { code: input.language },
          components: [{ type: "body", parameters: [input.line, input.awb, input.trackUrl].map((text) => ({ type: "text", text: text.slice(0, 900) })) }],
        },
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    const data = (await response.json().catch(() => ({}))) as { messages?: Array<{ id: string }>; error?: { message?: string; code?: number } };
    if (!response.ok || !data.messages?.[0]?.id) {
      console.error("[whatsapp.ts:sendWhatsAppUpdate]", response.status, data.error?.code, data.error?.message?.slice(0, 200));
      return { error: `WhatsApp returned ${response.status}.` };
    }
    return { ok: true, id: data.messages[0].id };
  } catch (error) {
    console.error("[whatsapp.ts:sendWhatsAppUpdate]", error instanceof Error ? error.message : error);
    return { error: "Could not reach WhatsApp." };
  }
}
