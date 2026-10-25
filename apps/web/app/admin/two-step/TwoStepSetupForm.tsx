"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

/** Confirms the first code from the authenticator app, which turns two-step login on. */
export function TwoStepSetupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/two-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: String(form.get("code") || "") }),
      });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "Could not turn on two-step login.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("[TwoStepSetupForm.tsx:onSubmit]", err instanceof Error ? err.message : err);
      setError("Could not turn on two-step login. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6">
      <label className="block text-sm text-[var(--muted)]">
        6-digit code
        <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required
          className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 tracking-[0.3em] text-[var(--off-white)]" />
      </label>
      {error ? <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" disabled={pending} className="mt-4 w-full rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
        {pending ? "Checking…" : "Turn on two-step login"}
      </button>
    </form>
  );
}
