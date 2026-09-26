import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { DraftBookControls } from "@/app/book/DraftBookControls";
import { InvoiceEditor } from "@/app/book/InvoiceEditor";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getInvoiceForShipment } from "@/lib/data/invoices";
import { getDraftShipmentForUser } from "@/lib/data/shipments";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function DraftSavedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await readSessionToken();
  const user = token ? await getUserBySessionToken(token) : null;
  if (!user) redirect("/signin");

  const { id } = await params;
  const shipment = await getDraftShipmentForUser(user.id, id);
  if (!shipment) notFound();

  let invoice = null;
  try {
    invoice =
      shipment.lane === "INTERNATIONAL"
        ? await getInvoiceForShipment(shipment.id)
        : null;
  } catch (error) {
    console.error(
      "[draft/[id]/page.tsx:DraftSavedPage]",
      error instanceof Error ? error.message : error,
    );
  }

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">
          Payment
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
          Book shipment
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {shipment.origin_city} → {shipment.destination_city} ({shipment.lane})
        </p>
        {shipment.lane === "INTERNATIONAL" ? (
          <InvoiceEditor
            shipmentId={shipment.id}
            currency={shipment.currency}
            initial={invoice}
          />
        ) : null}
        <Suspense fallback={<p className="mt-6 text-sm text-[var(--muted)]">Loading payment…</p>}>
          <DraftBookControls
            shipmentId={shipment.id}
            wantsCod={shipment.wants_cod === 1}
            lane={shipment.lane === "INTERNATIONAL" ? "INTERNATIONAL" : "DOMESTIC"}
          />
        </Suspense>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/book?editDraft=${encodeURIComponent(shipment.id)}`}
            className="rounded-md border border-[var(--teal)] px-4 py-2 text-sm text-[var(--teal)]"
          >
            Back
          </Link>
          <Link
            href="/account"
            className="ml-auto rounded-md border border-[var(--teal)] px-4 py-2 text-sm text-[var(--teal)]"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
