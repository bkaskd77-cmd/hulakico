import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import type { ContactMessageInput } from "@/lib/domain/contact";

export const MESSAGE_STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export type MessageView = "open" | "archived" | "all";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  reference: string | null;
  message: string;
  status: MessageStatus;
  createdAt: string;
};

const ID_OK = /^msg_[a-f0-9]{24}$/;
export const MESSAGES_PER_PAGE = 25;

export function isMessageStatus(value: unknown): value is MessageStatus {
  return typeof value === "string" && (MESSAGE_STATUSES as readonly string[]).includes(value);
}

function viewFilter(view: MessageView): string {
  if (view === "open") return `WHERE status != 'ARCHIVED'`;
  if (view === "archived") return `WHERE status = 'ARCHIVED'`;
  return "";
}

/** Newest first, one page at a time. `view` picks open, archived, or all messages. */
export async function listContactMessages(
  view: MessageView,
  page: number,
): Promise<{ items: ContactMessage[]; total: number; newCount: number } | { error: string }> {
  try {
    const sql = await getSql();
    const where = viewFilter(view);
    const offset = (Math.max(1, Math.floor(page)) - 1) * MESSAGES_PER_PAGE;
    const rows = (await sql
      .prepare(`SELECT id, name, email, phone, topic, reference, message, status, created_at FROM contact_messages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(MESSAGES_PER_PAGE, offset)) as Record<string, unknown>[];
    const total = (await sql.prepare(`SELECT COUNT(*) AS n FROM contact_messages ${where}`).get()) as { n: number };
    const fresh = (await sql.prepare(`SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'NEW'`).get()) as { n: number };
    const items = rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      phone: row.phone ? String(row.phone) : null,
      topic: String(row.topic),
      reference: row.reference ? String(row.reference) : null,
      message: String(row.message),
      status: isMessageStatus(row.status) ? row.status : "NEW",
      createdAt: String(row.created_at),
    }));
    return { items, total: Number(total?.n ?? 0), newCount: Number(fresh?.n ?? 0) };
  } catch (error) {
    console.error("[contact-messages.ts:listContactMessages]", error instanceof Error ? error.message : error);
    return { error: "Could not load messages." };
  }
}

/** Moves one message to a new status (read, replied, archived, or back to new). */
export async function setContactMessageStatus(
  id: string,
  status: MessageStatus,
): Promise<{ ok: true } | { error: string }> {
  if (!ID_OK.test(id)) return { error: "Unknown message." };
  if (!isMessageStatus(status)) return { error: "Unknown status." };
  try {
    const result = await (await getSql())
      .prepare(`UPDATE contact_messages SET status = ? WHERE id = ?`)
      .run(status, id);
    if (!result.changes) return { error: "Message not found." };
    return { ok: true };
  } catch (error) {
    console.error("[contact-messages.ts:setContactMessageStatus]", error instanceof Error ? error.message : error);
    return { error: "Could not update the message." };
  }
}

/** Stores a public contact-form message for the Hulakico team. */
export async function saveContactMessage(
  input: ContactMessageInput,
): Promise<{ id: string } | { error: string }> {
  try {
    const id = newId("msg");
    await (await getSql())
      .prepare(
        `INSERT INTO contact_messages
         (id, name, email, phone, topic, reference, message, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW', ?)`,
      )
      .run(
        id,
        input.name,
        input.email.toLowerCase(),
        input.phone || null,
        input.topic,
        input.reference || null,
        input.message,
        new Date().toISOString(),
      );
    return { id };
  } catch (error) {
    console.error(
      "[contact-messages.ts:saveContactMessage]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not send your message. Please try again." };
  }
}
