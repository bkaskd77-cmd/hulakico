import Link from "next/link";
import { redirect } from "next/navigation";
import { AttachPartnerAwbForm } from "@/app/ops/AttachPartnerAwbForm";
import { OpenExceptionForm } from "@/app/ops/OpenExceptionForm";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { listOpsShipments } from "@/lib/data/ops-shipments";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

const OPS_TRACK_STATUSES = new Set([
  "BOOKED",
  "HANDOVER_PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
]);

export default async function OpsShipmentsPage() {
  const token = await readSessionToken();
  if (!token || !(await getUserBySessionToken(token))) redirect("/signin");

  let shipments: ReturnType<typeof listOpsShipments> = [];
  let error: string | null = null;
  try {
    shipments = listOpsShipments();
  } catch (err) {
    console.error("[ops/page.tsx]", err instanceof Error ? err.message : err);
    error = "Could not load shipments.";
  }

  return (
    <div className="shell-sky min-h-dvh px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">Ops control tower</p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
              Active shipments
            </h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="/ops/exceptions" className="text-[var(--gold)] underline">Exceptions</Link>
            <Link href="/ops/cod" className="text-[var(--gold)] underline">COD</Link>
            <Link href="/ops/notifications" className="text-[var(--teal)] underline">Notifications</Link>
            <Link href="/ops/carriers" className="text-[var(--teal)] underline">Carriers</Link>
            <Link href="/account" className="text-[var(--teal)] underline">Account</Link>
          </nav>
        </div>

        {error ? <p className="mt-8 text-[var(--danger)]">{error}</p> : null}

        <ul className="mt-8 space-y-3">
          {shipments.map((shipment) => (
            <li
              key={shipment.id}
              className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--off-white)]">
                    {shipment.originCity} → {shipment.destinationCity}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {shipment.status} · {shipment.lane} · HK {shipment.hulakicoAwb ?? "—"} · Partner{" "}
                    {shipment.externalAwb ?? "—"} · {shipment.customerName}
                  </p>
                </div>
                {shipment.openExceptionId ? (
                  <span className="rounded bg-[var(--danger)] px-2 py-1 text-xs text-[var(--off-white)]">
                    Exception open
                  </span>
                ) : shipment.status !== "EXCEPTION" ? (
                  <OpenExceptionForm shipmentId={shipment.id} />
                ) : null}
              </div>
              {OPS_TRACK_STATUSES.has(shipment.status) ? (
                <AttachPartnerAwbForm
                  shipmentId={shipment.id}
                  currentAwb={shipment.externalAwb}
                  currentPartnerLabel={shipment.partnerLabel}
                  currentStatus={shipment.status}
                />
              ) : null}
            </li>
          ))}
        </ul>
        {shipments.length === 0 && !error ? (
          <p className="mt-8 text-sm text-[var(--muted)]">No shipments yet.</p>
        ) : null}
      </div>
    </div>
  );
}
