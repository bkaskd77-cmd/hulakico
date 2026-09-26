import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { copyShipmentAction } from "@/app/account/copy-actions";
import { ShipmentDetailPanels } from "@/app/account/ShipmentDetailPanels";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getMyShipmentSummary } from "@/lib/data/shipment-summary";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function OpenShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await readSessionToken();
  const user = token ? await getUserBySessionToken(token) : null;
  if (!user) redirect("/signin");

  const { id } = await params;
  const loaded = getMyShipmentSummary(user.id, id);
  if ("error" in loaded) notFound();
  const s = loaded;

  const trackHref = s.trackingToken ? `/track/${s.trackingToken}` : null;
  const draftHref =
    s.status === "DRAFT" || s.status === "QUOTED" ? `/book/draft/${s.id}` : null;

  return (
    <div className="shell-sky px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pb-4">
          <Link href="/account/shipments" className="text-sm font-semibold text-[var(--off-white)] underline-offset-2 hover:underline">
            ← All shipments
          </Link>
          <div className="flex flex-wrap gap-2 text-sm">
            <form action={copyShipmentAction}>
              <input type="hidden" name="shipmentId" value={s.id} />
              <button type="submit" className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_20%,transparent)] bg-[var(--navy-elevated)] px-3 py-1.5 font-semibold text-[var(--off-white)]">
                Copy
              </button>
            </form>
            {draftHref ? (
              <Link href={draftHref} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_20%,transparent)] bg-[var(--navy-elevated)] px-3 py-1.5 font-semibold text-[var(--off-white)]">
                Open draft
              </Link>
            ) : null}
            {trackHref ? (
              <Link href={trackHref} className="rounded-md bg-[var(--teal)] px-3 py-1.5 font-semibold text-[var(--off-white)]">
                Track
              </Link>
            ) : null}
            {s.lane === "INTERNATIONAL" ? (
              <Link href={`/book/invoice/${s.id}`} className="rounded-md bg-[var(--gold)] px-3 py-1.5 font-semibold text-[var(--navy)]">
                Invoice
              </Link>
            ) : null}
          </div>
        </div>

        <header className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">Shipment</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)]">
            {s.origin.city} → {s.destination.city}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {s.status.replaceAll("_", " ")} · {s.lane}
            {s.hulakicoAwb ? ` · ${s.hulakicoAwb}` : ""}
          </p>
        </header>

        <ShipmentDetailPanels s={s} />
      </div>
    </div>
  );
}
