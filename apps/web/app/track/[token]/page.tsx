import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrackingByToken } from "@/lib/data/tracking";

export const runtime = "nodejs";

export default async function PublicTrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tracking = getTrackingByToken(token);
  if (!tracking) {
    notFound();
  }

  return (
    <div className="shell-sky min-h-dvh px-6 py-16 sm:px-10">
      <div className="mx-auto w-full max-w-2xl rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">
          Hulakico
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
          Track shipment
        </h1>
        <dl className="mt-6 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide">AWB</dt>
            <dd className="text-[var(--off-white)]">{tracking.hulakicoAwb}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Status</dt>
            <dd className="text-[var(--off-white)]">{tracking.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Route</dt>
            <dd className="text-[var(--off-white)]">
              {tracking.originCity} → {tracking.destinationCity}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Carrier</dt>
            <dd className="text-[var(--off-white)]">
              {tracking.carrierName ?? "Pending"}
            </dd>
          </div>
        </dl>

        <ol className="mt-8 space-y-4 border-l border-[var(--teal)] pl-4">
          {tracking.events.map((event) => (
            <li key={event.id}>
              <p className="text-sm font-semibold text-[var(--off-white)]">
                {event.status}
              </p>
              <p className="text-sm text-[var(--muted)]">{event.description}</p>
              <p className="text-xs text-[var(--muted)]">
                {event.location ? `${event.location} · ` : ""}
                {new Date(event.occurredAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>

        <Link href="/" className="mt-8 inline-block text-sm text-[var(--teal)] underline">
          Back to Hulakico
        </Link>
      </div>
    </div>
  );
}
