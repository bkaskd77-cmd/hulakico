/** Customer-facing names and Nepal-time formatting for shipments, shared by every page. */

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  QUOTED: "Quoted",
  BOOKED: "Booked",
  HANDOVER_PENDING: "Picked up",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  EXCEPTION: "On hold",
  HOLD: "On hold",
  CANCELLED: "Cancelled",
  RTO: "Returned to sender",
};

const LANE_LABELS: Record<string, string> = { DOMESTIC: "Domestic", INTERNATIONAL: "International" };

export type StatusTone = "neutral" | "active" | "moving" | "done" | "alert" | "closed";

const TONES: Record<string, StatusTone> = {
  DRAFT: "neutral",
  QUOTED: "neutral",
  BOOKED: "active",
  HANDOVER_PENDING: "active",
  IN_TRANSIT: "moving",
  OUT_FOR_DELIVERY: "moving",
  DELIVERED: "done",
  EXCEPTION: "alert",
  HOLD: "alert",
  CANCELLED: "closed",
  RTO: "closed",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ").toLowerCase();
}

export function statusTone(status: string): StatusTone {
  return TONES[status] ?? "neutral";
}

export function laneLabel(lane: string): string {
  return LANE_LABELS[lane] ?? lane.toLowerCase();
}

/** "EXPRESS" → "Express", "SAME_DAY" → "Same day": readable form of any stored code. */
export function codeLabel(code: string): string {
  const words = code.replaceAll("_", " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Partner AWB a customer can use. Placeholder numbers (STUB_…) issued before Ops enters the
 * courier's real AWB are hidden.
 */
export function customerPartnerAwb(awb: string | null | undefined): string | null {
  const clean = (awb ?? "").trim();
  return clean && !/^STUB_/i.test(clean) ? clean : null;
}

/** Date and time in Nepal, whatever timezone the server or browser runs in. */
export function nepalTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleString("en-GB", { timeZone: "Asia/Kathmandu", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} NPT`;
}

/** Date only, in Nepal. */
export function nepalDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { timeZone: "Asia/Kathmandu", day: "numeric", month: "short", year: "numeric" });
}
