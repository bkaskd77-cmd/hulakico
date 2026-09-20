"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OpenExceptionForm({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/ops/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId, reason }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to open exception.");
        return;
      }
      setReason("");
      router.refresh();
    } catch (err) {
      console.error("[OpenExceptionForm.tsx:onSubmit]", err);
      setError("Failed to open exception.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-2">
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Exception reason"
        required
        minLength={5}
        className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-2 py-1 text-xs text-[var(--off-white)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--danger)] px-2 py-1 text-xs font-semibold text-[var(--off-white)] disabled:opacity-60"
      >
        {pending ? "Opening…" : "Flag exception"}
      </button>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </form>
  );
}
