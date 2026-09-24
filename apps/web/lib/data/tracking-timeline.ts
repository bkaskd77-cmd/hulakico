import type { TrackEvent } from "@/lib/data/tracking-types";

const STATUS_NOTE: Record<string, string> = {
  BOOKED: "Shipment is booked — waiting for partner handover.",
  HANDOVER_PENDING: "Handed over to the partner — movement will show next.",
  IN_TRANSIT: "The shipment is on its way to the destination.",
  OUT_FOR_DELIVERY: "Out for delivery in the destination city.",
  DELIVERED: "Delivered. Thank you for shipping with Hulakico.",
  EXCEPTION: "Shipment is on hold — action may be needed.",
  HOLD: "Shipment is on hold — action may be needed.",
};

const NEXT_STEP: Record<string, string> = {
  BOOKED: "Monitor this page for pickup and transit updates.",
  HANDOVER_PENDING: "Partner has the parcel — watch for in-transit scans.",
  IN_TRANSIT: "No action needed. We will update when it reaches your city.",
  OUT_FOR_DELIVERY: "Keep your phone nearby for the delivery attempt.",
  DELIVERED: "You can close this link or rebook from your account.",
  EXCEPTION: "Reply below or contact Hulakico so we can clear the hold.",
  HOLD: "Reply below or contact Hulakico so we can clear the hold.",
};

export function noteFor(status: string): string {
  return (
    STATUS_NOTE[status] ??
    `Shipment is ${status.replaceAll("_", " ").toLowerCase()} now.`
  );
}

export function nextStepFor(status: string): string {
  return (
    NEXT_STEP[status] ??
    "Monitor this page for the next status update."
  );
}

function isStubNoise(description: string): boolean {
  return /stub\s+(acceptance|transit|out for delivery)|sandbox (accepted|transit|out for)/i.test(
    description,
  );
}

function statusKey(status: string): string {
  return status === "EXCEPTION" ? "HOLD" : status;
}

/** One clean row per status — Hold keeps the latest Admin reason. */
export function cleanTimeline(events: TrackEvent[]): TrackEvent[] {
  const real = events.filter((event) => !isStubNoise(event.description));
  const best = new Map<string, TrackEvent>();
  for (const event of real) {
    const key = statusKey(event.status);
    const prev = best.get(key);
    if (!prev) {
      best.set(key, event);
      continue;
    }
    const preferNewer =
      key === "HOLD"
        ? event.occurredAt > prev.occurredAt
        : event.occurredAt < prev.occurredAt;
    if (preferNewer) best.set(key, event);
  }
  return [...best.values()].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt),
  );
}

export function syncEvents(
  events: TrackEvent[],
  status: string,
  updatedAt: string,
  location: string,
): TrackEvent[] {
  const key = statusKey(status);
  if (!STATUS_NOTE[status] && !STATUS_NOTE[key]) return events;
  if (events.some((e) => statusKey(e.status) === key)) return events;
  return [
    ...events,
    {
      id: `sync-${key}`,
      status: key === "HOLD" ? "HOLD" : status,
      description: noteFor(status),
      location,
      occurredAt: updatedAt,
    },
  ];
}
