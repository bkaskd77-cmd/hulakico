"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Ops: pull partner scans into Hulakico tracking_events. */
export function RefreshTrackingButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const response = await fetch(
        `/api/ops/shipments/${shipmentId}/refresh-tracking`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Refresh failed.");
        return;
      }
      setMessage(`Synced · status ${data.status} · +${data.added} events`);
      router.refresh();
    } catch (err) {
      console.error("[RefreshTrackingButton.tsx:onClick]", err);
      setError("Refresh failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-md border border-[var(--teal)] px-3 py-1.5 text-xs text-[var(--teal)] disabled:opacity-60"
      >
        {pending ? "Refreshing…" : "Refresh partner tracking"}
      </button>
      {error ? <p className="mt-1 text-xs text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="mt-1 text-xs text-[var(--teal)]">{message}</p> : null}
    </div>
  );
}
