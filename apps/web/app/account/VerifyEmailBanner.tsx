"use client";

import { useState } from "react";

/** Shown until the customer confirms their email; bookings wait for it. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function resend() {
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/verify/resend", { method: "POST" });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "Could not send the link.");
      setMessage(data.message);
    } catch (err) {
      console.error("[VerifyEmailBanner.tsx:resend]", err instanceof Error ? err.message : err);
      setError("Could not send the link. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div role="status" className="mt-6 rounded-lg border border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] p-4">
      <p className="text-sm font-semibold text-[var(--off-white)]">Confirm your email to start booking</p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        We sent a link to <span className="break-all text-[var(--off-white)]">{email}</span>. Open it to confirm; check your spam folder too.
      </p>
      <button type="button" onClick={resend} disabled={pending}
        className="mt-3 rounded-md bg-[var(--gold)] px-3 py-1.5 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
        {pending ? "Sending…" : "Send a new link"}
      </button>
      {message ? <p className="mt-2 text-sm text-[var(--teal)]">{message}</p> : null}
      {error ? <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
