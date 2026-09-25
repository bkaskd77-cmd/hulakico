function statusLabel(status: string): string {
  if (status === "HANDOVER_PENDING") return "Handed over / picked up";
  if (status === "EXCEPTION" || status === "HOLD") return "Hold";
  return status.replaceAll("_", " ");
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
          const location = atDest
            ? destinationCity
            : event.location || originCity;
          const description =
            event.status === "HANDOVER_PENDING" &&
            event.description.toLowerCase().includes("awaiting")
              ? "Handed over / picked up by partner."
              : event.description;
          return (
            <li
              key={event.id}
              className="track-timeline-item grid gap-1 px-5 py-4 pl-7 sm:grid-cols-[1.2fr_1fr_auto]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div>
                <p className="text-sm font-semibold text-[var(--off-white)]">
                  {history.length - index}. {statusLabel(event.status)}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
              </div>
              <p className="text-sm text-[var(--muted)]">{location}</p>
              <p className="text-xs text-[var(--muted)] sm:text-right">
                {new Date(event.occurredAt).toLocaleString()}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
