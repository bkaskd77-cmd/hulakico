import Link from "next/link";
import { listOpsShipments } from "@/lib/data/ops-shipments";

export const runtime = "nodejs";

function statusBadge(status: string): { label: string; className: string } {
  if (status === "DELIVERED") {
    return { label: "Delivered", className: "bg-emerald-500 text-[var(--navy)]" };
  }
  if (status === "EXCEPTION") {
    return {
      label: "Exception",
      className: "bg-[var(--danger)] text-[var(--off-white)]",
    };
  }
  if (status === "CANCELLED" || status === "RTO") {
    return {
      label: status === "RTO" ? "RTO" : "Cancelled",
      className: "bg-slate-500 text-[var(--off-white)]",
    };
  }
  if (status === "OUT_FOR_DELIVERY" || status === "IN_TRANSIT") {
    return {
      label: status === "IN_TRANSIT" ? "In transit" : "Out for delivery",
      className: "bg-[var(--gold)] text-[var(--navy)]",
    };
  }
  return {
    label: status.replaceAll("_", " "),
    className: "bg-[var(--teal-fill)] text-[var(--off-white)]",
  };
}

const BTN_GOLD =
  "rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)] transition hover:brightness-110";
const BTN_OUTLINE =
  "rounded-md border border-[var(--teal)] px-3 py-1.5 text-xs font-semibold text-[var(--teal)] transition hover:border-[var(--gold)] hover:text-[var(--gold)]";

export default async function AdminShipmentsPage() {
  let shipments: ReturnType<typeof listOpsShipments> = [];
  let error: string | null = null;
  try {
    shipments = listOpsShipments();
  } catch (err) {
    console.error(
      "[admin/shipments/page.tsx]",
      err instanceof Error ? err.message : err,
    );
    error = "Could not load shipments.";
  }

  const running = shipments.filter(
    (s) => !["DELIVERED", "CANCELLED", "RTO"].includes(s.status),
  ).length;
  const delivered = shipments.filter((s) => s.status === "DELIVERED").length;

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
        Shipments
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {running} in progress · {delivered} delivered — View details or Manage
        ops on the shipment page.
      </p>
      {error ? <p className="mt-8 text-[var(--danger)]">{error}</p> : null}
      <ul className="mt-8 space-y-3">
        {shipments.map((shipment) => {
          const badge = statusBadge(shipment.status);
          const href = `/admin/shipments/${shipment.id}`;
          return (
            <li
              key={shipment.id}
              className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--off-white)]">
                    {shipment.originCity} → {shipment.destinationCity}
                  </p>
                  <p className="text-xs text-[color-mix(in_srgb,var(--off-white)_78%,transparent)]">
                    {shipment.lane} · HK {shipment.hulakicoAwb ?? "—"} ·{" "}
                    {shipment.partnerLabel ?? "Partner"}{" "}
                    {shipment.externalAwb ?? "—"} · {shipment.customerName}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {shipment.openExceptionId ? (
                  <span className="rounded bg-[var(--danger)] px-2 py-1 text-xs text-[var(--off-white)]">
                    Exception open
                  </span>
                ) : null}
                <Link href={href} prefetch className={BTN_GOLD}>
                  View
                </Link>
                <Link href={`${href}?ops=1`} prefetch className={BTN_OUTLINE}>
                  Manage
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      {shipments.length === 0 && !error ? (
        <p className="mt-8 text-sm text-[var(--muted)]">No shipments yet.</p>
      ) : null}
    </>
  );
}
