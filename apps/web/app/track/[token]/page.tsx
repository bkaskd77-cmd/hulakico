import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackReplyForm } from "@/app/track/TrackReplyForm";
import { getTrackingByToken } from "@/lib/data/tracking";
import { partnerTrackUrl } from "@/lib/domain/partner-track-url";

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

  const partnerUrl = partnerTrackUrl(
    tracking.carrierName,
    tracking.externalAwb,
  );

  return (
    <div className="shell-sky min-h-dvh px-6 py-16 sm:px-10">
      <div className="mx-auto w-full max-w-2xl rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">
          Hulakico
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
          Track shipment
        </h1>
        <p className="mt-3 text-sm font-semibold text-[var(--gold)]">
          {tracking.statusNote}
        </p>
        <dl className="mt-6 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide">Hulakico AWB</dt>
            <dd className="break-all text-[var(--off-white)]">{tracking.hulakicoAwb}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Status</dt>
            <dd className="text-[var(--off-white)]">
              {tracking.status === "HANDOVER_PENDING"
                ? "Handed over / picked up"
                : tracking.status === "EXCEPTION"
                  ? "Hold"
                  : tracking.status.replaceAll("_", " ")}
            </dd>
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
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide">Partner AWB</dt>
            <dd className="mt-1 text-[var(--off-white)]">
              {tracking.externalAwb ? (
                partnerUrl ? (
                  <a href={partnerUrl} target="_blank" rel="noopener noreferrer"
                    className="break-all text-[var(--teal)] underline">
                    {tracking.externalAwb} — track on partner
                  </a>
                ) : (
                  <span className="break-all">{tracking.externalAwb}</span>
                )
              ) : (
                <span className="text-[var(--muted)]">Pending after handover</span>
              )}
            </dd>
          </div>
        </dl>

        {tracking.infoRequest ? (
          <div className="mt-8 rounded-md border border-[var(--gold)]/40 bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--gold)]">Action needed</p>
            <p className="mt-2 text-sm text-[var(--off-white)]">{tracking.infoRequest.note}</p>
            {tracking.infoRequest.customerReply ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                Your reply: {tracking.infoRequest.customerReply}
              </p>
            ) : (
              <TrackReplyForm trackingToken={tracking.trackingToken} />
            )}
          </div>
        ) : null}

        <ol className="mt-8 space-y-4 border-l border-[var(--teal)] pl-4">
          <p className="-ml-4 mb-4 text-xs uppercase tracking-wide text-[var(--muted)]">
            Status history
          </p>
          {tracking.events.map((event) => {
            const atDestination =
              event.status === "OUT_FOR_DELIVERY" || event.status === "DELIVERED";
            const location = atDestination
              ? tracking.destinationCity
              : event.location || tracking.originCity;
            const title =
              event.status === "HANDOVER_PENDING"
                ? "Handed over / picked up"
                : event.status === "EXCEPTION" || event.status === "HOLD"
                  ? "Hold"
                  : event.status.replaceAll("_", " ");
            const description =
              event.status === "HANDOVER_PENDING" &&
              event.description.toLowerCase().includes("awaiting")
                ? "Handed over / picked up by partner."
                : event.status === "EXCEPTION"
                  ? event.description.replace(/^Exception opened:\s*/i, "On hold: ")
                  : event.description;
            return (
              <li key={event.id}>
                <p className="text-sm font-semibold text-[var(--off-white)]">{title}</p>
                <p className="text-sm text-[var(--muted)]">{description}</p>
                <p className="text-xs text-[var(--muted)]">
                  {location} · {new Date(event.occurredAt).toLocaleString()}
                </p>
              </li>
            );
          })}
        </ol>

        <Link href="/" className="mt-8 inline-block text-sm text-[var(--teal)] underline">
          Back to Hulakico
        </Link>
      </div>
    </div>
  );
}
