import { COMPANY_CONTACT } from "@/lib/data/info-pages";
import { CONTACT_TOPICS, type ContactMessageInput } from "@/lib/domain/contact";

const INBOX = COMPANY_CONTACT.email;
const DEFAULT_FROM = `Hulakico <${COMPANY_CONTACT.email}>`;

function topicLabel(value: string): string {
  return CONTACT_TOPICS.find((topic) => topic.value === value)?.label ?? value;
}

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/** Delivers a contact-form inquiry to the Hulakico inbox. */
export async function sendInquiryEmail(
  input: ContactMessageInput,
): Promise<{ ok: true } | { error: string }> {
  const token = process.env.RESEND_API_KEY?.trim();
  const from = process.env.INQUIRY_FROM_EMAIL?.trim() || DEFAULT_FROM;
  if (!token) {
    console.error("[inquiry-mail.ts:sendInquiryEmail] RESEND_API_KEY is not set.");
    return { error: "Inquiry email is not configured on this server." };
  }

  const details = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    input.phone?.trim() ? `Phone: ${input.phone.trim()}` : "",
    `Topic: ${topicLabel(input.topic)}`,
    input.reference?.trim() ? `Hulakico AWB: ${input.reference.trim()}` : "",
  ].filter((line) => line !== "");
  const lines = [...details, "", input.message];

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [INBOX],
        reply_to: input.email,
        subject: oneLine(`Hulakico inquiry: ${topicLabel(input.topic)} — ${input.name}`),
        text: lines.join("\n"),
      }),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 240);
      console.error("[inquiry-mail.ts:sendInquiryEmail]", response.status, detail);
      return { error: "Could not deliver your message to the Hulakico inbox." };
    }
    return { ok: true };
  } catch (error) {
    console.error(
      "[inquiry-mail.ts:sendInquiryEmail]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not deliver your message to the Hulakico inbox." };
  }
}
