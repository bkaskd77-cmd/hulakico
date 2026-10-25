"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Staff confirms the flagged goods may ship; the customer can then pay. */
export function ApproveGoodsButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    if (!window.confirm("Approve these goods for shipping? The customer will be able to pay and book.")) return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/ops/shipments/${shipmentId}/customs-review`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "Could not save the review.");
      router.refresh();
    } catch (err) {
      console.error("[ApproveGoodsButton.tsx:approve]", err instanceof Error ? err.message : err);
      setError("Could not save the review.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={approve} disabled={pending} className="rounded-md bg-[#ffcc00] px-3 py-1.5 text-xs font-semibold text-[#191919] disabled:opacity-60">
        {pending ? "Saving…" : "Approve goods"}
      </button>
      {error ? <p role="alert" className="mt-1 text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
