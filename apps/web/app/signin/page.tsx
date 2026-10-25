"use client";

import Link from "next/link";
import { FormEvent, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

const noSubscribe = () => () => {};
const readRegistered = () =>
  new URLSearchParams(window.location.search).get("registered") === "1";
// Only same-site paths, so a crafted link cannot send the customer to another website.
const readNext = () => {
  const next = new URLSearchParams(window.location.search).get("next") ?? "";
  return /^\/(?!\/)[\w\-/]*$/.test(next) ? next : "/account";
};

export default function SigninPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Read after hydration: the server snapshot is false, the browser reads the URL.
  const registered = useSyncExternalStore(noSubscribe, readRegistered, () => false);
  const next = useSyncExternalStore(noSubscribe, readNext, () => "/account");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Sign in failed.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      console.error("[signin/page.tsx:onSubmit]", err);
      setError("Sign in failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
            Sign in
          </h1>
          <Link href="/" className="shrink-0 text-sm text-[var(--muted)] underline hover:text-[var(--off-white)]">
            Cancel
          </Link>
        </div>
        {registered ? (
          <p role="status" className="mt-4 rounded-md border border-[var(--teal)] bg-[color-mix(in_srgb,var(--teal)_14%,transparent)] px-4 py-3 text-sm text-[var(--off-white)]">
            Sign up successful! Please sign in with your email and password to continue.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Access your Hulakico shipments and bookings.
          </p>
        )}

        <label className="mt-6 block text-sm text-[var(--muted)]">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]"
          />
        </label>
        <label className="mt-4 block text-sm text-[var(--muted)]">
          Password
          <input
            name="password"
            type="password"
            minLength={8}
            required
            className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]"
          />
        </label>

        <p className="mt-2 text-right text-sm">
          <Link href="/forgot-password" className="text-[var(--teal)] underline">
            Forgot password?
          </Link>
        </p>

        {error ? (
          <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--navy)] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          New here?{" "}
          <Link href={next === "/account" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`} className="text-[var(--teal)] underline">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}
