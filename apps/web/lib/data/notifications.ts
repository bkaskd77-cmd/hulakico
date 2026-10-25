import { getSql } from "@/lib/sql";
import { runOnce } from "@/lib/sql/once";
import { newId } from "@/lib/domain/auth";
import { composeCustomerEmail, customerEmailEnabled, noticeSubject, sendCustomerEmail } from "@/lib/data/customer-mail";

export type NotifyKind =
  | "BOOKED"
  | "HOLD"
  | "HANDED_OVER"
  | "DELIVERED"
  | "PAID"
  | "CANCELLED";


export type NotificationRow = {
  id: string;
  shipmentId: string;
  hulakicoAwb: string | null;
  kind: string;
  channel: string;
  recipient: string;
  subject: string;
  status: string;
  provider: string;
  createdAt: string;
};

async function ensureNotificationsTable(): Promise<void> {
  await runOnce("outbound_notifications", async () => (await getSql()).exec(`
    CREATE TABLE IF NOT EXISTS outbound_notifications (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SMS')),
      kind TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'stub',
      status TEXT NOT NULL CHECK (status IN ('LOGGED', 'SENT', 'FAILED')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `));
}

/** Logs every customer notice; also emails it through Resend when NOTIFY_EMAIL=live. */
export async function logCustomerNotification(input: {
  shipmentId: string;
  kind: NotifyKind;
  subject: string;
  body: string;
}): Promise<{ ok: true; id: string } | { error: string }> {
  try {
    await ensureNotificationsTable();
    const db = await getSql();
    const owner = (await db
      .prepare(
        `SELECT s.user_id, s.hulakico_awb, s.tracking_token, u.email, u.name FROM shipments s
         JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
      )
      .get(input.shipmentId)) as
      | { user_id: string; email: string; name: string; hulakico_awb: string | null; tracking_token: string | null }
      | undefined;
    if (!owner) return { error: "Shipment owner not found for notification." };

    const id = newId("ntf");
    const now = new Date().toISOString();
    await db.prepare(
      `INSERT INTO outbound_notifications
       (id, shipment_id, user_id, channel, kind, recipient, subject, body, provider, status, created_at)
       VALUES (?, ?, ?, 'EMAIL', ?, ?, ?, ?, 'stub', 'LOGGED', ?)`,
    ).run(
      id, input.shipmentId, owner.user_id, input.kind, owner.email,
      input.subject, input.body, now,
    );
    if (customerEmailEnabled()) {
      const text = await composeCustomerEmail({
        kind: input.kind, name: owner.name, body: input.body, hulakicoAwb: owner.hulakico_awb, trackingToken: owner.tracking_token,
      });
      const subject = noticeSubject(input.kind, owner.hulakico_awb);
      const sent = await sendCustomerEmail({ to: owner.email, subject, text });
      await db.prepare(`UPDATE outbound_notifications SET status = ?, provider = 'resend', subject = ?, body = ? WHERE id = ?`)
        .run("error" in sent ? "FAILED" : "SENT", subject, text, id);
      if ("error" in sent) console.error("[notifications.ts:logCustomerNotification]", input.kind, input.shipmentId, sent.error);
    }
    return { ok: true, id };
  } catch (error) {
    console.error(
      "[notifications.ts:logCustomerNotification]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not log customer notification." };
  }
}

/** Recent stub/live outbound notices for Ops review. */
export async function listRecentNotifications(limit = 40): Promise<NotificationRow[]> {
  try {
    await ensureNotificationsTable();
    const safe =
      Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 40;
    const rows = (await (await getSql())
      .prepare(
        `SELECT n.id, n.shipment_id, n.kind, n.channel, n.recipient, n.subject,
                n.status, n.provider, n.created_at, s.hulakico_awb
         FROM outbound_notifications n
         LEFT JOIN shipments s ON s.id = n.shipment_id
         ORDER BY n.created_at DESC LIMIT ?`,
      )
      .all(safe)) as Array<{
      id: string; shipment_id: string; kind: string; channel: string;
      recipient: string; subject: string; status: string; provider: string;
      created_at: string; hulakico_awb: string | null;
    }>;
    return rows.map((row) => ({
      id: row.id,
      shipmentId: row.shipment_id,
      hulakicoAwb: row.hulakico_awb,
      kind: row.kind,
      channel: row.channel,
      recipient: row.recipient,
      subject: row.subject,
      status: row.status,
      provider: row.provider,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error(
      "[notifications.ts:listRecentNotifications]",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
