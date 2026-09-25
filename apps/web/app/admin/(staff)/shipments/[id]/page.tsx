import Link from "next/link";
import { notFound } from "next/navigation";
import { ShipmentDetailPanels } from "@/app/account/ShipmentDetailPanels";
import { AdminShipmentOps } from "@/app/admin/(staff)/AdminShipmentOps";
import { getDb } from "@/lib/db";
import { getStaffShipmentSummary } from "@/lib/data/shipment-summary";

export const runtime = "nodejs";

function openExceptionIdFor(shipmentId: string): string | null {
  try {
    const row = getDb()
      .prepare(
        `SELECT id FROM exception_cases
         WHERE shipment_id = ? AND status = 'OPEN'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(shipmentId) as { id: string } | undefined;
    return row?.id ?? null;
  } catch (error) {
    console.error(
      "[admin/shipments/[id]/page.tsx:openExceptionIdFor]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export default async function AdminShipmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ops?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const loaded = getStaffShipmentSummary(id);
  if ("error" in loaded) notFound();
  const s = loaded;
  const trackHref = s.trackingToken ? `/track/${s.trackingToken}` : null;
  const startOpen = query.ops === "1";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pb-4">
        <Link
          href="/admin/shipments"
          className="text-sm font-semibold text-[var(--off-white)] underline-offset-2 hover:underline"
        >
          ← Shipments
        </Link>
        {trackHref ? (
          <Link
            href={trackHref}
            className="rounded-md bg-[var(--teal-fill)] px-3 py-1.5 text-sm font-semibold text-[var(--off-white)]"
          >
            Public track
          </Link>
        ) : null}
      </div>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">
            Shipment detail
          </p>
          {s.status === "DELIVERED" ? (
            <span className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[var(--navy)]">
              Delivered
            </span>
          ) : ["CANCELLED", "RTO"].includes(s.status) ? (
            <span className="rounded-md bg-slate-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[var(--off-white)]">
              {s.status === "RTO" ? "RTO" : "Cancelled"}
            </span>
          ) : s.status === "EXCEPTION" ? (
            <span className="rounded-md bg-[var(--danger)] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[var(--off-white)]">
              Exception
            </span>
          ) : (
            <span className="rounded-md bg-[var(--gold)] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[var(--navy)]">
              In progress · {s.status.replaceAll("_", " ")}
            </span>
          )}
        </div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)]">
          {s.origin.city} → {s.destination.city}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {s.lane}
          {s.hulakicoAwb ? ` · ${s.hulakicoAwb}` : ""}
          {s.customerName ? ` · ${s.customerName}` : ""}
          {s.customerEmail ? ` · ${s.customerEmail}` : ""}
        </p>
      </header>

      <ShipmentDetailPanels s={s} />

      <section
        id="ops"
        className="mt-8 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">
          Ops actions
        </p>
        <AdminShipmentOps
          shipmentId={s.id}
          status={s.status}
          openExceptionId={openExceptionIdFor(s.id)}
          externalAwb={s.externalAwb}
          partnerLabel={s.partnerLabel}
          startOpen={startOpen}
          hideView
        />
      </section>
    </>
  );
}
