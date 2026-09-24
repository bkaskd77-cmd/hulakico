"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type StaffRole = "ADMIN" | "EDITOR" | "SUB_ADMIN";

const ROLES: Array<{ value: StaffRole; label: string; hint: string }> = [
  { value: "ADMIN", label: "Admin", hint: "Full control of the network" },
  { value: "EDITOR", label: "Editor", hint: "Update shipments and content" },
  {
    value: "SUB_ADMIN",
    label: "Sub-admin",
    hint: "Day-to-day ops under Admin",
  },
];

export default function AdminSignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<StaffRole>("ADMIN");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
          role,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Staff signup failed.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("[admin/signup/page.tsx:onSubmit]", err);
      setError("Staff signup failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-lg border border-[color-mix(in_srgb,var(--gold)_28%,transparent)] bg-[var(--navy-elevated)] p-8"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
          Hulakico Admin
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
          Create staff account
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Admin platform staff only. Choose a role for this account.
        </p>

        <div className="mt-6 space-y-2">
          {ROLES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                role === option.value
                  ? "bg-[var(--gold)] text-[var(--navy)]"
                  : "bg-[var(--navy)] text-[var(--muted)]"
              }`}
            >
              <span className="font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-xs opacity-80">
                {option.hint}
              </span>
            </button>
          ))}
        </div>

        <label className="mt-5 block text-sm text-[var(--muted)]">
          Full name
          <input
            name="name"
            required
            minLength={2}
            className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]"
          />
        </label>
        <label className="mt-4 block text-sm text-[var(--muted)]">
          Staff email
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
          {pending ? "Creating…" : "Create staff account"}
        </button>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Already staff?{" "}
          <Link href="/admin" className="text-[var(--teal)] underline">
            Staff sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
