import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getBookedShipmentForUser } from "@/lib/data/tracking";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function BookedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await readSessionToken();
  const user = token ? getUserBySessionToken(token) : null;
  if (!user) {
    redirect("/signin");
  }

  const { id } = await params;
  const shipment = getBookedShipmentForUser(user.id, id);
  if (!shipment || !shipment.hulakico_awb || !shipment.tracking_token) {
    notFound();
  }

  const trackPath = `/track/${shipment.tracking_token}`;

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">
          Booked
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
          Shipment confirmed
        </h1>
        <dl className="mt-6 space-y-3 text-sm text-[var(--muted)]">
          <div>
            <dt className="text-xs uppercase tracking-wide">Hulakico AWB</dt>
            <dd className="text-[var(--off-white)]">{shipment.hulakico_awb}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Partner AWB</dt>
            <dd className="text-[var(--off-white)]">{shipment.external_awb}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Status</dt>
            <dd className="text-[var(--off-white)]">{shipment.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Route</dt>
            <dd className="text-[var(--off-white)]">
              {shipment.origin_city} → {shipment.destination_city}
            </dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={trackPath}
            className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]"
          >
            Open tracking
          </Link>
          <Link href="/book" className="text-sm text-[var(--teal)] underline">
            Book another
          </Link>
        </div>
      </div>
    </div>
  );
}
