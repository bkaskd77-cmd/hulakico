"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Ops: cancel a shipment with a reason. Two clicks, so it is never done by accident. */
export function CancelShipmentForm({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function cancel() {
    setError(null);
    if (!confirming) return setConfirming(true);
    setPending(true);
    try {
      const res = await fetch(`/api/ops/shipments/${shipmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not cancel the shipment.");
      router.refresh();
    } catch (err) {
      console.error("[CancelShipmentForm.tsx:cancel]", err);
      setError("Could not cancel the shipment.");
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="Cancel reason (shown to the customer)"
        className="w-56 rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[var(--navy)] px-2.5 py-1.5 text-xs text-[var(--off-white)]" />
      <button type="button" onClick={cancel} disabled={pending || reason.trim().length < 3}
        className="rounded-md border border-[var(--danger)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] disabled:opacity-50">
        {pending ? "Cancelling…" : confirming ? "Click again to cancel" : "Cancel shipment"}
      </button>
      {error ? <span role="alert" className="text-xs text-[var(--danger)]">{error}</span> : null}
    </div>
  );
}
