import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getMyShipmentSummary } from "@/lib/data/shipment-summary";
import { partnerTrackUrl } from "@/lib/domain/partner-track-url";
import { readSessionToken } from "@/lib/http/session-cookie";
import { countryName } from "@/app/book/countries";

export const runtime = "nodejs";

export default async function OpenShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await readSessionToken();
  const user = token ? getUserBySessionToken(token) : null;
  if (!user) redirect("/signin");

  const { id } = await params;
  const loaded = getMyShipmentSummary(user.id, id);
  if ("error" in loaded) notFound();
  const s = loaded;

  const trackHref = s.trackingToken ? `/track/${s.trackingToken}` : null;
  const draftHref =
    s.status === "DRAFT" || s.status === "QUOTED" ? `/book/draft/${s.id}` : null;
  const partnerUrl = partnerTrackUrl(s.carrierName, s.externalAwb);

  return (
    <div className="shell-sky min-h-dvh px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-lg rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">Shipment</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
          {s.originCity} → {s.destinationCity}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {s.status} · {s.lane}
          {s.carrierName ? ` · ${s.carrierName}` : ""}
        </p>

        <dl className="mt-6 space-y-3 text-sm text-[var(--muted)]">
          <div>
            <dt className="text-xs uppercase tracking-wide">Hulakico AWB</dt>
            <dd className="break-all text-[var(--off-white)]">{s.hulakicoAwb ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Partner AWB</dt>
            <dd className="mt-1 text-[var(--off-white)]">
              {s.externalAwb ? (
                partnerUrl ? (
                  <a href={partnerUrl} target="_blank" rel="noopener noreferrer"
                    className="break-all text-[var(--teal)] underline">
                    {s.externalAwb} — track on partner
                  </a>
                ) : (
                  <span className="break-all">{s.externalAwb}</span>
                )
              ) : (
                <span className="text-[var(--muted)]">Pending after handover</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Shipper</dt>
            <dd className="text-[var(--off-white)]">
              {s.originContactName || "—"} · {countryName(s.originCountry)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Consignee</dt>
            <dd className="text-[var(--off-white)]">
              {s.destinationContactName || "—"} · {countryName(s.destinationCountry)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Package</dt>
            <dd className="text-[var(--off-white)]">
              {s.packageType} · {s.serviceClass} · {s.weightKg} kg · {s.currency}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Contents</dt>
            <dd className="text-[var(--off-white)]">{s.contents || "—"}</dd>
          </div>
          {s.lane === "INTERNATIONAL" ? (
            <div>
              <dt className="text-xs uppercase tracking-wide">Digital invoice</dt>
              <dd className="text-[var(--off-white)]">
                {s.invoice
                  ? `${s.invoice.lines.length} line(s) · ${s.invoice.currency} ${s.invoice.totalValue.toFixed(2)}`
                  : "Not saved yet"}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          {s.lane === "INTERNATIONAL" ? (
            <Link href={`/book/invoice/${s.id}`}
              className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]">
              View digital invoice
            </Link>
          ) : null}
          {draftHref ? (
            <Link href={draftHref}
              className="rounded-md border border-[var(--teal)] px-4 py-2 text-sm text-[var(--teal)]">
              Open draft
            </Link>
          ) : null}
          {trackHref ? (
            <Link href={trackHref}
              className="rounded-md border border-[var(--teal)] px-4 py-2 text-sm text-[var(--teal)]">
              Track on Hulakico
            </Link>
          ) : null}
          <Link href="/account/shipments"
            className="rounded-md border border-[var(--muted)] px-4 py-2 text-sm text-[var(--off-white)]">
            All shipments
          </Link>
        </div>
      </div>
    </div>
  );
}
