"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OpsMilestoneButtons } from "@/app/ops/OpsMilestoneButtons";
import { PARTNER_PRESETS, type PartnerKey } from "@/lib/domain/partner-track-url";

const FIELD =
  "mt-1 rounded-md border border-[color-mix(in_srgb,var(--off-white)_28%,transparent)] bg-[var(--navy)] px-2.5 py-1.5 text-sm text-[var(--off-white)] outline-none transition focus:border-[var(--gold)]";

function partnerKeyFromLabel(label: string | null): PartnerKey {
  const lower = (label ?? "").toLowerCase();
  if (lower.includes("fedex")) return "fedex";
  if (lower.includes("dhl")) return "dhl";
  if (label) return "other";
  return "dhl";
}

/** Ops: partner + AWB (+ optional URL) and Hulakico milestones. */
export function AttachPartnerAwbForm({
  shipmentId,
  currentAwb,
  currentPartnerLabel,
  currentStatus,
}: {
  shipmentId: string;
  currentAwb: string | null;
  currentPartnerLabel?: string | null;
  currentStatus: string;
}) {
  const router = useRouter();
  const [partnerKey, setPartnerKey] = useState<PartnerKey>(
    partnerKeyFromLabel(currentPartnerLabel ?? null),
  );
  const [awb, setAwb] = useState(currentAwb ?? "");
  const [trackUrl, setTrackUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const response = await fetch(`/api/ops/shipments/${shipmentId}/partner-awb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerKey,
          externalAwb: awb,
          trackUrl: trackUrl.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not save partner tracking.");
        return;
      }
      setAwb(data.externalAwb ?? awb);
      setTrackUrl("");
      setMessage(`Saved ${data.partnerLabel} · ${data.externalAwb}`);
      router.refresh();
    } catch (err) {
      console.error("[AttachPartnerAwbForm.tsx:onSubmit]", err);
      setError("Could not save partner tracking.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[8rem] flex-col text-xs font-semibold text-[var(--off-white)]">
            Shipment partner
            <select value={partnerKey} onChange={(e) => setPartnerKey(e.target.value as PartnerKey)}
              className={FIELD}>
              {PARTNER_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[12rem] flex-1 flex-col text-xs font-semibold text-[var(--off-white)]">
            Partner AWB
            <input value={awb} onChange={(e) => setAwb(e.target.value)} required minLength={6}
              maxLength={40} placeholder="Waybill number" className={FIELD} />
          </label>
          <button type="submit" disabled={pending}
            className="rounded-md bg-[var(--gold)] px-3.5 py-1.5 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110 disabled:opacity-60">
            {pending ? "Saving…" : "Save tracking"}
          </button>
        </div>
        <label className="flex flex-col text-xs font-semibold text-[var(--off-white)]">
          Tracking URL (optional)
          <input value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)} type="url"
            placeholder="Leave blank for DHL/FedEx — we build it"
            className={`${FIELD} placeholder:text-[color-mix(in_srgb,var(--off-white)_45%,transparent)]`} />
        </label>
      </form>
      <OpsMilestoneButtons shipmentId={shipmentId} currentStatus={currentStatus} onError={setError} />
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-[var(--gold)]">{message}</p> : null}
    </div>
  );
}
