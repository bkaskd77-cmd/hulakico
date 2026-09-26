import { notFound } from "next/navigation";
import { TrackBackNav } from "@/app/track/TrackBackNav";
import { TrackHistory } from "@/app/track/TrackHistory";
import { TrackReplyForm } from "@/app/track/TrackReplyForm";
import { getTrackingByToken } from "@/lib/data/tracking";
import { nextStepFor } from "@/lib/data/tracking-timeline";
import { effectivePartnerTrackUrl } from "@/lib/domain/partner-track-url";

export const runtime = "nodejs";

function statusLabel(status: string): string {
  if (status === "HANDOVER_PENDING") return "Handed over / picked up";
  if (status === "EXCEPTION" || status === "HOLD") return "Hold";
  return status.replaceAll("_", " ");
}

export default async function PublicTrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tracking = await getTrackingByToken(token);
  if (!tracking) notFound();

  const partnerUrl = effectivePartnerTrackUrl({
    partnerLabel: tracking.partnerLabel,
    awb: tracking.externalAwb,
    storedUrl: tracking.partnerTrackUrl,
  });
  const carrierDisplay =
    tracking.partnerLabel ?? tracking.carrierName ?? "Pending";
  const latest = tracking.events[tracking.events.length - 1];

  return (
    <div className="shell-sky px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">Hulakico</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)]">
              Track shipment
            </h1>
          </div>
          <TrackBackNav />
        </header>

        <section className="hub-enter mt-6 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5 sm:p-6">
          <p className={`text-sm font-semibold ${
            tracking.status === "EXCEPTION" || tracking.holdInfo
              ? "text-[var(--danger)]"
              : "text-[var(--teal)]"
          }`}>
            {statusLabel(tracking.status)}
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--off-white)]">{tracking.statusNote}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--off-white)]">Next step: </span>
            {tracking.holdInfo ? tracking.holdInfo.contactHint : nextStepFor(tracking.status)}
          </p>
          {latest ? (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Last update {new Date(latest.occurredAt).toLocaleString()}
              {latest.location ? ` · ${latest.location}` : ""}
            </p>
          ) : null}

          <dl className="mt-6 grid gap-4 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Hulakico AWB</dt>
              <dd className="mt-1 break-all font-semibold text-[var(--off-white)]">{tracking.hulakicoAwb}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Route</dt>
              <dd className="mt-1 text-[var(--off-white)]">
                {tracking.originCity} → {tracking.destinationCity}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Carrier</dt>
              <dd className="mt-1 text-[var(--off-white)]">{carrierDisplay}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Partner AWB</dt>
              <dd className="mt-1 break-all text-[var(--off-white)]">
                {tracking.externalAwb ? (
                  partnerUrl ? (
                    <a href={partnerUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] underline">
                      {tracking.externalAwb}
                    </a>
                  ) : (
                    tracking.externalAwb
                  )
                ) : (
                  <span className="text-[var(--muted)]">Pending after handover</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {tracking.holdInfo ? (
          <div className="mt-4 rounded-lg border border-[var(--danger)]/40 bg-[color-mix(in_srgb,var(--danger)_18%,var(--navy))] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">On hold</p>
            <p className="mt-2 text-sm text-[var(--off-white)]">{tracking.holdInfo.reason}</p>
          </div>
        ) : null}

        {tracking.infoRequest ? (
          <div className="mt-4 rounded-lg border border-[var(--gold)]/40 bg-[color-mix(in_srgb,var(--gold)_16%,var(--navy))] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">Action needed</p>
            <p className="mt-2 text-sm text-[var(--off-white)]">{tracking.infoRequest.note}</p>
            {tracking.infoRequest.customerReply ? (
              <p className="mt-3 text-sm text-[var(--muted)]">Your reply: {tracking.infoRequest.customerReply}</p>
            ) : (
              <TrackReplyForm trackingToken={tracking.trackingToken} />
            )}
          </div>
        ) : null}

        <TrackHistory
          events={tracking.events}
          originCity={tracking.originCity}
          destinationCity={tracking.destinationCity}
        />
      </div>
    </div>
  );
}
