"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RequestQuotesButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/bookings/${shipmentId}/quotes`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not generate quotes.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("[RequestQuotesButton.tsx:onClick]", err);
      setError("Could not generate quotes.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)] disabled:opacity-60"
      >
        {pending ? "Quoting…" : "Get quotes"}
      </button>
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
