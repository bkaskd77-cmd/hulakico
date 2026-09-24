import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";

export type NotifyKind =
  | "BOOKED"
  | "HOLD"
  | "HANDED_OVER"
  | "DELIVERED"
  | "PAID";


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

function ensureNotificationsTable(): void {
  getDb().exec(`
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
  `);
}

/** Stub outbound notify — logs only until EMAIL/SMS provider is wired. */
export function logCustomerNotification(input: {
  shipmentId: string;
  kind: NotifyKind;
  subject: string;
  body: string;
}): { ok: true; id: string } | { error: string } {
  try {
    ensureNotificationsTable();
    const db = getDb();
    const owner = db
      .prepare(
        `SELECT s.user_id, u.email FROM shipments s
         JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
      )
      .get(input.shipmentId) as { user_id: string; email: string } | undefined;
    if (!owner) return { error: "Shipment owner not found for notification." };

    const id = newId("ntf");
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO outbound_notifications
       (id, shipment_id, user_id, channel, kind, recipient, subject, body, provider, status, created_at)
       VALUES (?, ?, ?, 'EMAIL', ?, ?, ?, ?, 'stub', 'LOGGED', ?)`,
    ).run(
      id, input.shipmentId, owner.user_id, input.kind, owner.email,
      input.subject, input.body, now,
    );
    console.info(
      `[notifications.ts] stub EMAIL ${input.kind} → ${owner.email} (${input.shipmentId})`,
    );
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
export function listRecentNotifications(limit = 40): NotificationRow[] {
  try {
    ensureNotificationsTable();
    const safe =
      Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 40;
    const rows = getDb()
      .prepare(
        `SELECT n.id, n.shipment_id, n.kind, n.channel, n.recipient, n.subject,
                n.status, n.provider, n.created_at, s.hulakico_awb
         FROM outbound_notifications n
         LEFT JOIN shipments s ON s.id = n.shipment_id
         ORDER BY n.created_at DESC LIMIT ?`,
      )
      .all(safe) as Array<{
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
