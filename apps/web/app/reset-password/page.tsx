"use client";

import Link from "next/link";
import { FormEvent, useState, useSyncExternalStore } from "react";

const FIELD = "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]";
const noSubscribe = () => () => {};
const readToken = () => new URLSearchParams(window.location.search).get("token") ?? "";

export default function ResetPasswordPage() {
  // Read after hydration: the server snapshot is empty, the browser reads the link.
  const token = useSyncExternalStore(noSubscribe, readToken, () => "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== String(form.get("confirm") || "")) return setError("The two passwords do not match.");
    setPending(true);
    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "Could not reset the password.");
      setDone(true);
    } catch (err) {
      console.error("[reset-password/page.tsx:onSubmit]", err instanceof Error ? err.message : err);
      setError("Could not reset the password. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">Choose a new password</h1>
        {done ? (
          <>
            <p role="status" className="mt-4 rounded-md border border-[var(--teal)] bg-[color-mix(in_srgb,var(--teal)_14%,transparent)] px-4 py-3 text-sm text-[var(--off-white)]">
              Your password is changed and you are signed out on all devices. Sign in with the new password.
            </p>
            <Link href="/signin" className="mt-6 block w-full rounded-md bg-[var(--gold)] px-4 py-3 text-center text-sm font-semibold text-[var(--navy)]">Sign in</Link>
          </>
        ) : !token ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            This page needs the link from your reset email. <Link href="/forgot-password" className="text-[var(--teal)] underline">Ask for a new link</Link>.
          </p>
        ) : (
          <>
            <label className="mt-6 block text-sm text-[var(--muted)]">
              New password
              <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={FIELD} />
            </label>
            <label className="mt-4 block text-sm text-[var(--muted)]">
              Repeat new password
              <input name="confirm" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={FIELD} />
            </label>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
                {error} {error.includes("expired") ? <Link href="/forgot-password" className="text-[var(--teal)] underline">New link</Link> : null}
              </p>
            ) : null}
            <button type="submit" disabled={pending} className="mt-6 w-full rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
              {pending ? "Saving…" : "Save new password"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
