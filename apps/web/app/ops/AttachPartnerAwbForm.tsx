"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const MILESTONES = [
  { status: "BOOKED", label: "Booked", opsSets: false },
  { status: "HANDOVER_PENDING", label: "Handed over", opsSets: true },
  { status: "IN_TRANSIT", label: "In transit", opsSets: true },
  { status: "OUT_FOR_DELIVERY", label: "Out for delivery", opsSets: true },
  { status: "DELIVERED", label: "Delivered", opsSets: true },
] as const;

const RANK: Record<string, number> = {
  BOOKED: 0, HANDOVER_PENDING: 1, IN_TRANSIT: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 4, EXCEPTION: 0,
};

const NOW_NOTE: Record<string, string> = {
  BOOKED: "Shipment is booked now.",
  HANDOVER_PENDING: "Shipment is handed over / picked up now.",
  IN_TRANSIT: "Shipment is in transit now.",
  OUT_FOR_DELIVERY: "Shipment is out for delivery now.",
  DELIVERED: "Shipment is delivered now.",
  EXCEPTION: "Shipment is on hold now.",
};

function statusNowNote(status: string): string {
  return NOW_NOTE[status] ?? `Shipment is ${status.replaceAll("_", " ").toLowerCase()} now.`;
}

/** Ops: partner AWB + Hulakico milestones (forward jump OK; never backward). */
export function AttachPartnerAwbForm({
  shipmentId, currentAwb, currentStatus,
}: {
  shipmentId: string; currentAwb: string | null; currentStatus: string;
}) {
  const router = useRouter();
  const [awb, setAwb] = useState(currentAwb ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [milestonePending, setMilestonePending] = useState<string | null>(null);
  const currentRank = RANK[currentStatus] ?? 0;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const response = await fetch(`/api/ops/shipments/${shipmentId}/partner-awb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalAwb: awb }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not save partner AWB.");
        return;
      }
      setAwb(data.externalAwb ?? awb);
      setMessage("Partner AWB saved.");
      router.refresh();
    } catch (err) {
      console.error("[AttachPartnerAwbForm.tsx:onSubmit]", err);
      setError("Could not save partner AWB.");
    } finally {
      setPending(false);
    }
  }

  async function postMilestone(status: string) {
    setError(null);
    setMessage(null);
    setMilestonePending(status);
    try {
      const response = await fetch(`/api/ops/shipments/${shipmentId}/milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not update Hulakico status.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("[AttachPartnerAwbForm.tsx:postMilestone]", err);
      setError("Could not update Hulakico status.");
    } finally {
      setMilestonePending(null);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-[12rem] flex-1 flex-col text-xs text-[var(--muted)]">
          Partner AWB
          <input value={awb} onChange={(e) => setAwb(e.target.value)} required minLength={6}
            maxLength={40} placeholder="DHL / FedEx waybill"
            className="mt-1 rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-2 py-1 text-xs text-[var(--off-white)]" />
        </label>
        <button type="submit" disabled={pending}
          className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)] disabled:opacity-60">
          {pending ? "Saving…" : currentAwb ? "Update AWB" : "Attach AWB"}
        </button>
      </form>
      <div>
        <p className="text-xs font-semibold text-[var(--gold)]">
          {statusNowNote(currentStatus)}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {MILESTONES.map((item) => {
            const rank = RANK[item.status] ?? 0;
            const isCurrent = currentStatus === item.status;
            const isDone = rank < currentRank;
            const canClick = item.opsSets && rank > currentRank;
            return (
              <button key={item.status} type="button"
                disabled={!canClick || milestonePending !== null}
                onClick={() => postMilestone(item.status)}
                title={
                  !item.opsSets ? "Set when customer books"
                    : canClick ? `Set to ${item.label}`
                    : isCurrent ? "Current" : "Passed"
                }
                className={`rounded-md px-2 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isCurrent
                    ? "bg-[var(--gold)] font-semibold text-[var(--navy)]"
                    : isDone
                      ? "border border-[var(--teal)] bg-[color-mix(in_srgb,var(--teal)_18%,transparent)] text-[var(--teal)]"
                      : canClick
                        ? "border border-[color-mix(in_srgb,var(--off-white)_28%,transparent)] text-[var(--off-white)] hover:border-[var(--gold)] hover:bg-[color-mix(in_srgb,var(--gold)_16%,transparent)] hover:text-[var(--gold)]"
                        : "border border-[color-mix(in_srgb,var(--off-white)_20%,transparent)] text-[var(--muted)]"
                }`}>
                {milestonePending === item.status ? "…" : item.label}
              </button>
            );
          })}
        </div>
      </div>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="text-xs text-[var(--teal)]">{message}</p> : null}
    </div>
  );
}
