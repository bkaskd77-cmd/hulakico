const STEPS = [
  { status: "BOOKED", label: "Booked" },
  { status: "HANDOVER_PENDING", label: "Picked up" },
  { status: "IN_TRANSIT", label: "In transit" },
  { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { status: "DELIVERED", label: "Delivered" },
] as const;

const RANK: Record<string, number> = { BOOKED: 0, HANDOVER_PENDING: 1, IN_TRANSIT: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 4 };

/** Furthest normal step the shipment reached, so a hold shows where it stopped. */
function reachedStep(status: string, history: string[]): number {
  if (status in RANK) return RANK[status];
  return history.reduce((best, step) => Math.max(best, RANK[step] ?? -1), 0);
}

/** Courier-style progress bar above the tracking details. */
export function TrackProgress({ status, history }: { status: string; history: string[] }) {
  if (status === "CANCELLED" || status === "RTO") {
    return (
      <p className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_20%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--off-white)]">
        {status === "RTO" ? "This shipment is being returned to the sender." : "This shipment was cancelled."}
      </p>
    );
  }
  const current = reachedStep(status, history);
  const held = status === "EXCEPTION" || status === "HOLD";
  const pct = (current / (STEPS.length - 1)) * 100;

  return (
    <div aria-label={`Progress: ${STEPS[current].label}${held ? ", on hold" : ""}`} role="img" className="pb-1">
      <div className="relative mx-[10%] h-1.5 rounded-full bg-[color-mix(in_srgb,var(--off-white)_14%,transparent)]">
        <div className={`absolute inset-y-0 left-0 rounded-full ${held ? "bg-[var(--danger)]" : "bg-[#ffcc00]"} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <ol className="-mt-[0.7rem] grid grid-cols-5">
        {STEPS.map((step, index) => {
          const done = index < current || (index === current && status === "DELIVERED");
          const here = index === current && status !== "DELIVERED";
          return (
            <li key={step.status} className="flex flex-col items-center text-center">
              <span aria-hidden className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                done ? "border-[#ffcc00] bg-[#ffcc00]"
                  : here ? (held ? "border-[var(--danger)] bg-[var(--danger)]" : "border-[#ffcc00] bg-[var(--navy-elevated)] ring-4 ring-[color-mix(in_srgb,#ffcc00_30%,transparent)]")
                  : "border-[color-mix(in_srgb,var(--off-white)_30%,transparent)] bg-[var(--navy-elevated)]"}`} />
              <span className={`mt-2 text-[11px] leading-tight sm:text-xs ${done || here ? "font-semibold text-[var(--off-white)]" : "text-[var(--muted)]"}`}>
                {step.label}
                {here && held ? <span className="block text-[var(--danger)]">On hold</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
