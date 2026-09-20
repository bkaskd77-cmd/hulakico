"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CollectCodForm({ codId }: { codId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/ops/cod/${codId}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to mark collected.");
        return;
      }
      setNote("");
      router.refresh();
    } catch (err) {
      console.error("[CollectCodForm.tsx:onSubmit]", err);
      setError("Failed to mark collected.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-2">
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Collection note"
        required
        minLength={2}
        className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-2 py-1 text-xs text-[var(--off-white)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--gold)] px-2 py-1 text-xs font-semibold text-[var(--navy)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Mark collected"}
      </button>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </form>
  );
}
