"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SigninPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
      router.push("/account");
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
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
            Sign in
          </p>
          <Link href="/" className="shrink-0 text-sm text-[var(--muted)] underline hover:text-[var(--off-white)]">
            Cancel
          </Link>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Access your Hulakico shipments and bookings.
        </p>

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
          <Link href="/" className="text-[var(--off-white)] underline">
            Cancel
          </Link>
          {" · "}
          New here?{" "}
          <Link href="/signup" className="text-[var(--teal)] underline">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}
