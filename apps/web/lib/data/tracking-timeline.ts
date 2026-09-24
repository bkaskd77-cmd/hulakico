import type { TrackEvent } from "@/lib/data/tracking-types";

const STATUS_NOTE: Record<string, string> = {
  BOOKED: "Shipment is booked now.",
  HANDOVER_PENDING: "Shipment is handed over / picked up now.",
  IN_TRANSIT: "Shipment is in transit now.",
  OUT_FOR_DELIVERY: "Shipment is out for delivery now.",
  DELIVERED: "Shipment is delivered now.",
  EXCEPTION: "Shipment is on hold now.",
  HOLD: "Shipment is on hold now.",
};

export function noteFor(status: string): string {
  return (
    STATUS_NOTE[status] ??
    `Shipment is ${status.replaceAll("_", " ").toLowerCase()} now.`
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
