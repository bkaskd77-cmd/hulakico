import Link from "next/link";
import { notFound } from "next/navigation";
import { ShipmentDetailPanels } from "@/app/account/ShipmentDetailPanels";
import { AdminShipmentOps } from "@/app/admin/(staff)/AdminShipmentOps";
import { getSql } from "@/lib/sql";
import { getStaffShipmentSummary } from "@/lib/data/shipment-summary";
import { requireStaffPage } from "@/lib/http/require-staff";
import { laneLabel } from "@/lib/domain/shipment-labels";
import { StatusPill } from "@/app/StatusPill";
import { AiCustomsPanel } from "@/app/admin/(staff)/shipments/[id]/AiCustomsPanel";
import { DeliveryProofPanel } from "@/app/account/DeliveryProofPanel";

export const runtime = "nodejs";

async function openExceptionIdFor(shipmentId: string): Promise<string | null> {
  try {
    const row = (await (await getSql())
      .prepare(
        `SELECT id FROM exception_cases
         WHERE shipment_id = ? AND status = 'OPEN'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(shipmentId)) as { id: string } | undefined;
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
  await requireStaffPage("operations");
  const { id } = await params;
  const query = await searchParams;
  const loaded = await getStaffShipmentSummary(id);
  if ("error" in loaded) notFound();
  const s = loaded;
  const openExceptionId = await openExceptionIdFor(s.id);
  const trackHref = s.trackingToken ? `/track/${s.trackingToken}` : null;
  // Actions are what staff come here for, so the panel starts open.
  const startOpen = query.ops !== "0";

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
        {s.hulakicoAwb ? (
          <Link href={`/label/${s.id}`} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_40%,transparent)] px-3 py-1.5 text-sm font-semibold text-[var(--off-white)]">
            Print label
          </Link>
        ) : null}
      </div>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">
            Shipment detail
          </p>
          <StatusPill status={s.status} />
        </div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)]">
          {s.origin.city} → {s.destination.city}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {laneLabel(s.lane)}
          {s.hulakicoAwb ? ` · ${s.hulakicoAwb}` : ""}
          {s.customerName ? ` · ${s.customerName}` : ""}
          {s.customerEmail ? ` · ${s.customerEmail}` : ""}
        </p>
      </header>

      <section
        id="ops"
        className="mt-8 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4"
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">
          Update this shipment
        </h2>
        <p className="text-xs text-[var(--muted)]">Tracking steps, partner AWB, exceptions, and cancellation.</p>
        <AdminShipmentOps
          shipmentId={s.id}
          status={s.status}
          openExceptionId={openExceptionId}
          externalAwb={s.externalAwb}
          partnerLabel={s.partnerLabel}
          startOpen={startOpen}
          hideView
        />
      </section>

      {s.lane === "INTERNATIONAL" ? <AiCustomsPanel shipmentId={s.id} /> : null}

      <DeliveryProofPanel shipmentId={s.id} />
      <ShipmentDetailPanels s={s} />
    </>
  );
}
