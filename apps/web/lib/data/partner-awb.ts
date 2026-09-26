import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import {
  isPartnerKey,
  partnerLabelForKey,
  resolvePartnerTrackUrl,
  type PartnerKey,
} from "@/lib/domain/partner-track-url";

const BOOKED_STATUSES = [
  "BOOKED",
  "HANDOVER_PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "EXCEPTION",
] as const;

async function ensurePartnerTrackColumns(): Promise<void> {
  const db = await getSql();
  const columns = (await db.prepare("PRAGMA table_info(shipments)").all()) as Array<{
    name: string;
  }>;
  const names = new Set(columns.map((c) => c.name));
  if (!names.has("partner_label")) {
    await db.exec(`ALTER TABLE shipments ADD COLUMN partner_label TEXT`);
  }
  if (!names.has("partner_track_url")) {
    await db.exec(`ALTER TABLE shipments ADD COLUMN partner_track_url TEXT`);
  }
}

/** Ops: set fulfillment partner, AWB, and track URL (auto or override). */
export async function updatePartnerTracking(input: {
  shipmentId: string;
  partnerKey: string;
  externalAwb: string;
  trackUrl?: string | null;
}): Promise<
  | {
      ok: true;
      externalAwb: string;
      partnerLabel: string;
      partnerTrackUrl: string | null;
    }
  | { error: string }
> {
  try {
    if (!isPartnerKey(input.partnerKey)) {
      return { error: "Choose a shipment partner (DHL, FedEx, or Other)." };
    }
    const partnerKey: PartnerKey = input.partnerKey;
    const awb = input.externalAwb.trim().toUpperCase();
    if (awb.length < 6 || awb.length > 40) {
      return { error: "Partner AWB must be 6–40 characters." };
    }

    const partnerLabel = partnerLabelForKey(partnerKey);
    const trackUrl = resolvePartnerTrackUrl({
      partnerKey,
      awb,
      urlOverride: input.trackUrl,
    });
    if (partnerKey === "other" && !trackUrl) {
      return {
        error: "Other partners require a tracking URL (https://…).",
      };
    }
    if (input.trackUrl?.trim() && !trackUrl) {
      return { error: "Tracking URL must be a valid http(s) link." };
    }

    await ensurePartnerTrackColumns();
    const db = await getSql();
    const row = (await db
      .prepare(
        `SELECT id, status, external_awb, origin_country FROM shipments WHERE id = ?`,
      )
      .get(input.shipmentId)) as
      | {
          id: string;
          status: string;
          external_awb: string | null;
          origin_country: string;
        }
      | undefined;
    if (!row) return { error: "Shipment not found." };
    if (!(BOOKED_STATUSES as readonly string[]).includes(row.status)) {
      return { error: "Partner AWB can only be set on booked shipments." };
    }

    const now = new Date().toISOString();
    const previous = row.external_awb?.trim() || null;
    await db.prepare(
      `UPDATE shipments
       SET external_awb = ?, partner_label = ?, partner_track_url = ?, updated_at = ?
       WHERE id = ?`,
    ).run(awb, partnerLabel, trackUrl, now, input.shipmentId);

    const description = previous
      ? `Partner tracking updated (${partnerLabel}): ${previous} → ${awb}.`
      : `Partner tracking attached (${partnerLabel}): ${awb}.`;
    await db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      newId("evt"),
      input.shipmentId,
      row.status,
      description,
      row.origin_country,
      now,
    );

    return {
      ok: true,
      externalAwb: awb,
      partnerLabel,
      partnerTrackUrl: trackUrl,
    };
  } catch (error) {
    console.error(
      "[partner-awb.ts:updatePartnerTracking]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not save partner tracking." };
  }
}
