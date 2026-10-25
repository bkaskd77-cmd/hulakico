"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const FIELD = "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(form.get("email") || "") }),
      });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "Could not send the reset link.");
      setSent(data.message);
    } catch (err) {
      console.error("[forgot-password/page.tsx:onSubmit]", err instanceof Error ? err.message : err);
      setError("Could not send the reset link. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">Forgot password</h1>
        {sent ? (
          <p role="status" className="mt-4 rounded-md border border-[var(--teal)] bg-[color-mix(in_srgb,var(--teal)_14%,transparent)] px-4 py-3 text-sm text-[var(--off-white)]">
            {sent} Check your inbox and spam folder. The link expires in 30 minutes.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-[var(--muted)]">Enter your account email and we will send you a link to choose a new password.</p>
            <label className="mt-6 block text-sm text-[var(--muted)]">
              Email
              <input name="email" type="email" required maxLength={120} autoComplete="email" className={FIELD} />
            </label>
            {error ? <p role="alert" className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
            <button type="submit" disabled={pending} className="mt-6 w-full rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          <Link href="/signin" className="text-[var(--teal)] underline">Back to sign in</Link>
        </p>
      </form>
    </div>
  );
}
