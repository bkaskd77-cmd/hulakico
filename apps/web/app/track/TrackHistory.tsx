import { nepalTime, statusLabel } from "@/lib/domain/shipment-labels";

export { nepalTime };

/** Customer-facing name for a shipment step, used by the history and the page headline. */
export function trackStatusLabel(status: string): string {
  return statusLabel(status);
}

type TrackEvent = {
  id: string;
  status: string;
  description: string;
  occurredAt: string;
  location: string | null;
};

/** Reversed status timeline for the public track page. */
export function TrackHistory({
  events,
  originCity,
  destinationCity,
}: {
  events: TrackEvent[];
  originCity: string;
  destinationCity: string;
}) {
  const history = [...events].reverse();
  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)]">
      <div className="border-b border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">
          Status history
        </p>
      </div>
      <ol className="divide-y divide-[color-mix(in_srgb,var(--off-white)_10%,transparent)]">
        {history.map((event, index) => {
          const atDest =
            event.status === "OUT_FOR_DELIVERY" || event.status === "DELIVERED";
          // The place Ops recorded wins; older rows may hold only a country code ("NP").
          const recorded = event.location && event.location.trim().length > 2 ? event.location : "";
          const location = recorded || (atDest ? destinationCity : originCity);
          const description =
            event.status === "HANDOVER_PENDING" &&
            event.description.toLowerCase().includes("awaiting")
              ? "Picked up by the courier."
              : event.description;
          return (
            <li
              key={event.id}
              className="track-timeline-item grid gap-1 px-5 py-4 pl-7 sm:grid-cols-[1.2fr_1fr_auto]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div>
                <p className="text-sm font-semibold text-[var(--off-white)]">
                  {history.length - index}. {trackStatusLabel(event.status)}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
              </div>
              <p className="text-sm text-[var(--muted)]">{location}</p>
              <p className="text-xs text-[var(--muted)] sm:text-right">
                {nepalTime(event.occurredAt)}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
