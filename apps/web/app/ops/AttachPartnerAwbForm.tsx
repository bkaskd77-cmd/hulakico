"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

/** Ops form to paste/correct the third-party (DHL/FedEx) waybill. */
export function AttachPartnerAwbForm({
  shipmentId,
  currentAwb,
}: {
  shipmentId: string;
  currentAwb: string | null;
}) {
  const router = useRouter();
  const [awb, setAwb] = useState(currentAwb ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
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
      router.refresh();
    } catch (err) {
      console.error("[AttachPartnerAwbForm.tsx:onSubmit]", err);
      setError("Could not save partner AWB.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-end gap-2">
      <label className="flex min-w-[12rem] flex-1 flex-col text-xs text-[var(--muted)]">
        Partner AWB
        <input
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
          required
          minLength={6}
          maxLength={40}
          placeholder="DHL / FedEx waybill"
          className="mt-1 rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-2 py-1 text-xs text-[var(--off-white)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)] disabled:opacity-60"
      >
        {pending ? "Saving…" : currentAwb ? "Update AWB" : "Attach AWB"}
      </button>
      {error ? <p className="w-full text-xs text-[var(--danger)]">{error}</p> : null}
    </form>
  );
}
