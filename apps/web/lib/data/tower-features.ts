import type { EtaRiskBatchItem } from "@/lib/data/intelligence-batch";

/** Live delay features sent to the intelligence service with each active shipment. */
export type RiskFeatureItem = EtaRiskBatchItem & {
  status: string;
  hoursInStatus: number | null;
  hoursSinceBooking: number | null;
  etaDaysMax: number | null;
  openExceptions: number;
};

export type TowerSqlRow = {
  id: string;
  status: string;
  lane: string;
  origin_city: string;
  destination_city: string;
  service_class: string;
  hulakico_awb: string | null;
  email: string;
  open_exceptions: number;
  latest_track_status: string | null;
  status_since: string | null;
  booked_at: string | null;
  eta_days_max: number | null;
  pay_pending: number;
};

/** Active shipments with the timestamps and promise needed for delay features. */
export function towerSql(placeholders: string): string {
  return `SELECT s.id, s.status, s.lane, s.origin_city, s.destination_city,
                 s.service_class, s.hulakico_awb, u.email,
                 (SELECT COUNT(*) FROM exception_cases e
                  WHERE e.shipment_id = s.id AND e.status = 'OPEN') as open_exceptions,
                 (SELECT te.status FROM tracking_events te
                  WHERE te.shipment_id = s.id ORDER BY te.occurred_at DESC LIMIT 1) as latest_track_status,
                 COALESCE((SELECT MAX(te.occurred_at) FROM tracking_events te
                  WHERE te.shipment_id = s.id), s.updated_at) as status_since,
                 COALESCE((SELECT MIN(te.occurred_at) FROM tracking_events te
                  WHERE te.shipment_id = s.id), s.created_at) as booked_at,
                 (SELECT qo.eta_days_max FROM quote_options qo
                  WHERE qo.id = s.selected_quote_option_id) as eta_days_max,
                 EXISTS (SELECT 1 FROM payment_intents p
                  WHERE p.shipment_id = s.id AND p.status = 'AWAITING_PAYMENT') as pay_pending
          FROM shipments s
          JOIN users u ON u.id = s.user_id
          WHERE s.status IN (${placeholders})
          ORDER BY s.updated_at DESC
          LIMIT 40`;
}

/** Whole hours between an ISO timestamp and now; null when the timestamp is unusable. */
export function hoursSince(iso: string | null, now: number): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.round((now - at) / 36e5));
}

/** Maps one SQL row to the payload the risk model scores. */
export function toRiskItem(row: TowerSqlRow, now: number): RiskFeatureItem {
  return {
    id: row.id,
    lane: row.lane,
    destinationCity: row.destination_city,
    serviceClass: row.service_class,
    status: row.status,
    hoursInStatus: hoursSince(row.status_since, now),
    hoursSinceBooking: hoursSince(row.booked_at, now),
    etaDaysMax: row.eta_days_max ?? null,
    openExceptions: Number(row.open_exceptions) || 0,
  };
}
