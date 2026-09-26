"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "BUSINESS">(
    "INDIVIDUAL",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get("type");
    if (type === "business") setAccountType("BUSINESS");
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
          accountType,
          organizationName:
            accountType === "BUSINESS"
              ? String(form.get("organizationName") || "")
              : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Signup failed.");
        return;
      }
      router.push("/signin?registered=1");
    } catch (err) {
      console.error("[signup/page.tsx:onSubmit]", err);
      setError("Signup failed. Please try again.");
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
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
          Create account
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Individual or business — Hulakico middleman booking starts here.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {(
            [
              ["INDIVIDUAL", "Individual"],
              ["BUSINESS", "Business"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAccountType(value)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                accountType === value
                  ? "bg-[var(--teal)] text-[var(--off-white)]"
                  : "bg-[var(--navy)] text-[var(--muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="mt-5 block text-sm text-[var(--muted)]">
          Full name
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]"
          />
        </label>
        {accountType === "BUSINESS" ? (
          <label className="mt-4 block text-sm text-[var(--muted)]">
            Organization name
            <input
              name="organizationName"
              required
              className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]"
            />
          </label>
        ) : null}
        <label className="mt-4 block text-sm text-[var(--muted)]">
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
          {pending ? "Creating…" : "Create account"}
        </button>
        <Link href="/" className="mt-3 block w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_20%,transparent)] px-4 py-3 text-center text-sm font-medium text-[var(--off-white)] hover:bg-[var(--navy)]">
          Cancel
        </Link>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/signin" className="text-[var(--teal)] underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
