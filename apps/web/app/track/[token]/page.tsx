import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackReplyForm } from "@/app/track/TrackReplyForm";
import { getTrackingByToken } from "@/lib/data/tracking";
import { nextStepFor } from "@/lib/data/tracking-timeline";
import { partnerTrackUrl } from "@/lib/domain/partner-track-url";

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
  const tracking = getTrackingByToken(token);
  if (!tracking) notFound();

  const partnerUrl = partnerTrackUrl(tracking.carrierName, tracking.externalAwb);
  const latest = tracking.events[tracking.events.length - 1];
  const history = [...tracking.events].reverse();

  return (
    <div className="min-h-dvh bg-[#eef5f8] px-4 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">Hulakico</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
              Track shipment
            </h1>
          </div>
          <Link href="/" className="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline">
            Back to Hulakico
          </Link>
        </header>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
          <p className="text-sm font-semibold text-[var(--teal)]">
            {statusLabel(tracking.status)}
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{tracking.statusNote}</p>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Next step: </span>
            {tracking.holdInfo
              ? tracking.holdInfo.contactHint
              : nextStepFor(tracking.status)}
          </p>
          {latest ? (
            <p className="mt-3 text-xs text-slate-500">
              Last update {new Date(latest.occurredAt).toLocaleString()}
              {latest.location ? ` · ${latest.location}` : ""}
            </p>
          ) : null}

          <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hulakico AWB</dt>
              <dd className="mt-1 break-all font-semibold text-slate-900">{tracking.hulakicoAwb}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Route</dt>
              <dd className="mt-1 text-slate-900">
                {tracking.originCity} → {tracking.destinationCity}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Carrier</dt>
              <dd className="mt-1 text-slate-900">{tracking.carrierName ?? "Pending"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Partner AWB</dt>
              <dd className="mt-1 break-all text-slate-900">
                {tracking.externalAwb ? (
                  partnerUrl ? (
                    <a href={partnerUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--teal)] underline">
                      {tracking.externalAwb}
                    </a>
                  ) : (
                    tracking.externalAwb
                  )
                ) : (
                  <span className="text-slate-500">Pending after handover</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {tracking.holdInfo ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">On hold</p>
            <p className="mt-2 text-sm text-slate-900">{tracking.holdInfo.reason}</p>
          </div>
        ) : null}

        {tracking.infoRequest ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Action needed</p>
            <p className="mt-2 text-sm text-slate-900">{tracking.infoRequest.note}</p>
            {tracking.infoRequest.customerReply ? (
              <p className="mt-3 text-sm text-slate-600">Your reply: {tracking.infoRequest.customerReply}</p>
            ) : (
              <TrackReplyForm trackingToken={tracking.trackingToken} />
            )}
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status history</p>
          </div>
          <ol className="divide-y divide-slate-100">
            {history.map((event, index) => {
              const atDest =
                event.status === "OUT_FOR_DELIVERY" || event.status === "DELIVERED";
              const location = atDest
                ? tracking.destinationCity
                : event.location || tracking.originCity;
              const description =
                event.status === "HANDOVER_PENDING" &&
                event.description.toLowerCase().includes("awaiting")
                  ? "Handed over / picked up by partner."
                  : event.description;
              return (
                <li key={event.id} className="grid gap-1 px-5 py-4 sm:grid-cols-[1.2fr_1fr_auto]">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {history.length - index}. {statusLabel(event.status)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{description}</p>
                  </div>
                  <p className="text-sm text-slate-600">{location}</p>
                  <p className="text-xs text-slate-500 sm:text-right">
                    {new Date(event.occurredAt).toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
