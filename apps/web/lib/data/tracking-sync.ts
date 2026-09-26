import { getCarrierAdapter } from "@/lib/carriers/adapter";
import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import { latestHulakicoStatus } from "@/lib/domain/carrier-status-map";

/** Pull partner tracking into Hulakico events + shipment status (idempotent). */
export async function syncTrackingFromCarrier(
  shipmentId: string,
): Promise<{ ok: true; status: string; added: number } | { error: string }> {
  try {
    const db = await getSql();
    const row = (await db
      .prepare(
        `SELECT s.id, s.external_awb, s.status, s.origin_country, c.adapter_key
         FROM shipments s
         LEFT JOIN carriers c ON c.id = s.carrier_id
         WHERE s.id = ?`,
      )
      .get(shipmentId)) as
      | {
          id: string;
          external_awb: string | null;
          status: string;
          origin_country: string;
          adapter_key: string | null;
        }
      | undefined;

    if (!row) return { error: "Shipment not found." };
    if (!row.external_awb?.trim()) {
      return { error: "Attach a partner AWB before refreshing tracking." };
    }
    if (!row.adapter_key) return { error: "Shipment has no carrier adapter." };

    const events = await getCarrierAdapter(row.adapter_key).getTracking(
      row.external_awb.trim(),
    );
    if (events.length === 0) {
      return { ok: true, status: row.status, added: 0 };
    }

    const existing = (await db
      .prepare(
        `SELECT description, occurred_at FROM tracking_events WHERE shipment_id = ?`,
      )
      .all(shipmentId)) as Array<{ description: string; occurred_at: string }>;
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
        shipmentId,
        event.status,
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
      shipmentId,
    );

    return { ok: true, status: nextStatus, added };
  } catch (error) {
    console.error(
      "[tracking-sync.ts:syncTrackingFromCarrier]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not sync partner tracking." };
  }
}
