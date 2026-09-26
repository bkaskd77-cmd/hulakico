"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function StaffSignInForm({ denied = false }: { denied?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Staff sign in failed.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("[StaffSignInForm.tsx:onSubmit]", err);
      setError("Staff sign in failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-lg border border-[color-mix(in_srgb,var(--gold)_28%,transparent)] bg-[var(--navy-elevated)] p-8"
      suppressHydrationWarning
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
        Hulakico Admin
      </p>
      <p className="font-display mt-2 text-2xl font-bold text-[var(--off-white)]">
        Staff sign in
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Admin platform only. Staff credentials required.
      </p>

      {denied ? (
        <p className="mt-4 text-sm text-[var(--danger)]">
          Staff session required or access denied.
        </p>
      ) : null}

      <label className="mt-6 block text-sm text-[var(--muted)]">
        Staff email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          suppressHydrationWarning
          className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]"
        />
      </label>
      <label className="mt-4 block text-sm text-[var(--muted)]">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
          suppressHydrationWarning
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
        {pending ? "Signing in…" : "Enter control tower"}
      </button>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        New staff?{" "}
        <Link href="/admin/signup" className="text-[var(--teal)] underline">
          Ask an Admin for an account
        </Link>
      </p>
    </form>
  );
}
