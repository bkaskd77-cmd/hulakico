import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";
import type { ContactMessageInput } from "@/lib/domain/contact";

/** Stores a public contact-form message for the Hulakico team. */
export function saveContactMessage(
  input: ContactMessageInput,
): { id: string } | { error: string } {
  try {
    const id = newId("msg");
    getDb()
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
