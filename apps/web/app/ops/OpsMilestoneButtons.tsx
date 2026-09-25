"use client";

import { useState } from "react";
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

/** Forward-only Hulakico milestone buttons for Ops. */
export function OpsMilestoneButtons({
  shipmentId,
  currentStatus,
  onError,
}: {
  shipmentId: string;
  currentStatus: string;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const currentRank = RANK[currentStatus] ?? 0;

  async function postMilestone(status: string) {
    onError(null);
    setPending(status);
    try {
      const response = await fetch(`/api/ops/shipments/${shipmentId}/milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        onError(data.error || "Could not update Hulakico status.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("[OpsMilestoneButtons.tsx:postMilestone]", err);
      onError("Could not update Hulakico status.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-[var(--gold)]">
        {`Shipment is ${currentStatus.replaceAll("_", " ").toLowerCase()} now.`}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {MILESTONES.map((item) => {
          const rank = RANK[item.status] ?? 0;
          const isCurrent = currentStatus === item.status;
          const isDone = rank < currentRank;
          const canClick = item.opsSets && rank > currentRank;
          return (
            <button key={item.status} type="button" disabled={!canClick || pending !== null}
              onClick={() => postMilestone(item.status)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                isCurrent ? "bg-[var(--gold)] text-[var(--navy)]"
                  : isDone ? "border border-[var(--teal)] bg-[color-mix(in_srgb,var(--teal)_28%,transparent)] text-[var(--off-white)]"
                  : canClick ? "border border-[color-mix(in_srgb,var(--off-white)_40%,transparent)] text-[var(--off-white)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                  : "border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] opacity-70 text-[var(--off-white)]"
              }`}>
              {pending === item.status ? "…" : item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
