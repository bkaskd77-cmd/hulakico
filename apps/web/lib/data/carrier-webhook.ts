import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import {
  latestHulakicoStatus,
  mapPartnerStatusToHulakico,
} from "@/lib/domain/carrier-status-map";

export type CarrierWebhookEvent = {
  status: string;
  description: string;
  occurredAt: string;
  location?: string;
};

/** Ingest partner webhook scans into tracking_events (by partner AWB). */
export async function ingestCarrierWebhook(
  externalAwb: string,
  events: CarrierWebhookEvent[],
): Promise<
  { ok: true; shipmentId: string; status: string; added: number } | { error: string }
> {
  try {
    const awb = externalAwb.trim().toUpperCase();
    if (!awb || events.length === 0) {
      return { error: "externalAwb and events are required." };
    }
    const db = await getSql();
    const row = (await db
      .prepare(`SELECT id, status FROM shipments WHERE upper(external_awb) = ?`)
      .get(awb)) as { id: string; status: string } | undefined;
    if (!row) return { error: "No shipment matches that partner AWB." };

    const existing = (await db
      .prepare(
        `SELECT description, occurred_at FROM tracking_events WHERE shipment_id = ?`,
      )
      .all(row.id)) as Array<{ description: string; occurred_at: string }>;
    const seen = new Set(
      existing.map((item) => `${item.occurred_at}|${item.description}`),
    );

    let added = 0;
    const insert = db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    for (const event of events) {
      const key = `${event.occurredAt}|${event.description}`;
      if (seen.has(key)) continue;
      await insert.run(
        newId("evt"),
        row.id,
        mapPartnerStatusToHulakico(event.status),
        event.description,
        event.location ?? null,
        event.occurredAt,
      );
      seen.add(key);
      added += 1;
    }

    const nextStatus = latestHulakicoStatus(events.map((event) => event.status));
    const now = new Date().toISOString();
    await db.prepare(`UPDATE shipments SET status = ?, updated_at = ? WHERE id = ?`).run(
      nextStatus,
      now,
      row.id,
    );
    return { ok: true, shipmentId: row.id, status: nextStatus, added };
  } catch (error) {
    console.error(
      "[carrier-webhook.ts:ingestCarrierWebhook]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not ingest carrier webhook." };
  }
}
