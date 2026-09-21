"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function TrackReplyForm({ trackingToken }: { trackingToken: string }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/track/${trackingToken}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to send reply.");
        return;
      }
      setReply("");
      router.refresh();
    } catch (err) {
      console.error("[TrackReplyForm.tsx:onSubmit]", err);
      setError("Failed to send reply.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
      <textarea
        value={reply}
        onChange={(event) => setReply(event.target.value)}
        placeholder="Your reply to Hulakico ops"
        required
        minLength={3}
        rows={3}
        className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-sm text-[var(--off-white)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--gold)] px-3 py-2 text-sm font-semibold text-[var(--navy)] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reply"}
      </button>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </form>
  );
}
