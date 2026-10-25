import { countryName } from "@/app/book/countries";
import type { ShipmentParty, ShipmentSummary } from "@/lib/data/shipment-summary";
import { effectivePartnerTrackUrl } from "@/lib/domain/partner-track-url";
import { codeLabel, customerPartnerAwb, laneLabel, nepalTime } from "@/lib/domain/shipment-labels";

function PartyBlock({ title, party }: { title: string; party: ShipmentParty }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 font-semibold text-slate-900">{party.contactName || "—"}</p>
      {party.company && party.company.trim().toLowerCase() !== (party.contactName ?? "").trim().toLowerCase() ? (
        <p className="text-sm text-slate-700">{party.company}</p>
      ) : null}
      <p className="mt-2 text-sm text-slate-700">
        {[party.line1, party.line2].filter(Boolean).join(", ") || "—"}
      </p>
      <p className="text-sm text-slate-700">
        {[party.city, party.postalCode].filter(Boolean).join(" ")}
        {party.country ? ` · ${countryName(party.country)}` : ""}
      </p>
      {party.phone ? <p className="mt-2 text-sm text-slate-600">{party.phone}</p> : null}
      {party.email ? <p className="text-sm text-slate-600">{party.email}</p> : null}
    </div>
  );
}

/** Detail panels for customer shipment overview. */
export function ShipmentDetailPanels({ s }: { s: ShipmentSummary }) {
  const partnerAwb = customerPartnerAwb(s.externalAwb);
  const partnerUrl = effectivePartnerTrackUrl({
    partnerLabel: s.partnerLabel,
    awb: partnerAwb,
    storedUrl: s.partnerTrackUrl,
  });
  const carrierDisplay = s.partnerLabel ?? s.carrierName;
  const dims =
    s.lengthCm && s.widthCm && s.heightCm
      ? `${s.lengthCm} × ${s.widthCm} × ${s.heightCm} cm`
      : "—";

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hulakico AWB</p>
          <p className="mt-1 break-all font-semibold text-slate-900">{s.hulakicoAwb ?? "—"}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Partner AWB</p>
          <p className="mt-1 break-all text-slate-800">
            {partnerAwb ? (
              partnerUrl ? (
                <a href={partnerUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--teal)] underline">
                  {partnerAwb}
                </a>
              ) : (
                partnerAwb
              )
            ) : (
              <span className="text-slate-500">Pending after handover</span>
            )}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dates</p>
          <p className="mt-1 text-slate-800">Created {nepalTime(s.createdAt)}</p>
          <p className="text-slate-800">Updated {nepalTime(s.updatedAt)}</p>
          {carrierDisplay ? <p className="mt-2 text-slate-600">Carrier · {carrierDisplay}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PartyBlock title="Ship from" party={s.origin} />
        <PartyBlock title="Ship to" party={s.destination} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Package</p>
          <p className="mt-2 text-slate-900">
            {codeLabel(s.packageType)} · {codeLabel(s.serviceClass)} · {laneLabel(s.lane)}
          </p>
          <dl className="mt-3 space-y-1 text-slate-700">
            <div className="flex justify-between gap-4"><dt>Actual weight</dt><dd>{s.weightKg} kg</dd></div>
            <div className="flex justify-between gap-4"><dt>Dimensions</dt><dd>{dims}</dd></div>
            <div className="flex justify-between gap-4">
              <dt>Volumetric</dt><dd>{s.volumetricKg != null ? `${s.volumetricKg} kg` : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 font-semibold text-slate-900">
              <dt>Chargeable</dt><dd>{s.chargeableKg} kg</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs italic text-slate-500">
            Weights may be rechecked by the carrier at pickup.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contents & payment</p>
          <p className="mt-2 text-slate-900">{s.contents || "—"}</p>
          {s.declaredValue != null ? (
            <p className="mt-2 text-slate-700">
              Declared {s.currency} {s.declaredValue.toFixed(2)}
            </p>
          ) : null}
          <p className="mt-3 font-semibold text-slate-900">{s.settle.label}</p>
          {s.settle.detail ? <p className="mt-1 text-xs text-slate-600">{s.settle.detail}</p> : null}
          {s.lane === "INTERNATIONAL" ? (
            <p className="mt-3 text-slate-700">
              Invoice ·{" "}
              {s.invoice
                ? `${s.invoice.lines.length} line(s) · ${s.invoice.currency} ${s.invoice.totalValue.toFixed(2)}`
                : "Not saved yet"}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
