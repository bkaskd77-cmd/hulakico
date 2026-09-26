"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffRole } from "@/lib/data/staff-auth";
import { ROLE_HINTS, ROLE_LABELS } from "@/lib/domain/staff-permissions";

const ROLES: StaffRole[] = ["ADMIN", "EDITOR", "SUB_ADMIN"];
const INPUT =
  "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)]";

/** "first" bootstraps the first Admin and signs in; "admin" lets an Admin add a team member. */
export function StaffSignupForm({ mode }: { mode: "first" | "admin" }) {
  const router = useRouter();
  const [role, setRole] = useState<StaffRole>(mode === "first" ? "ADMIN" : "EDITOR");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreated(null);
    setPending(true);
    const formElement = event.currentTarget;
    try {
      const form = new FormData(formElement);
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
      if (mode === "first") {
        router.push("/admin");
        router.refresh();
        return;
      }
      setCreated(`${data.staff.email} can now sign in as ${ROLE_LABELS[data.staff.role as StaffRole]}.`);
      formElement.reset();
    } catch (err) {
      console.error("[StaffSignupForm.tsx:onSubmit]", err);
      setError("Staff signup failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-[color-mix(in_srgb,var(--gold)_28%,transparent)] bg-[var(--navy-elevated)] p-8">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Hulakico Admin</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
        {mode === "first" ? "Create the first Admin" : "Add a staff account"}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {mode === "first"
          ? "No staff exist yet. This first account gets full Admin access."
          : "Choose what this person can do. Share the password with them securely."}
      </p>

      {mode === "admin" ? (
        <div className="mt-6 space-y-2">
          {ROLES.map((value) => (
            <button key={value} type="button" onClick={() => setRole(value)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${role === value ? "bg-[var(--gold)] text-[var(--navy)]" : "bg-[var(--navy)] text-[var(--muted)]"}`}>
              <span className="font-semibold">{ROLE_LABELS[value]}</span>
              <span className="mt-0.5 block text-xs opacity-80">{ROLE_HINTS[value]}</span>
            </button>
          ))}
        </div>
      ) : null}

      <label className="mt-5 block text-sm text-[var(--muted)]">
        Full name
        <input name="name" required minLength={2} className={INPUT} />
      </label>
      <label className="mt-4 block text-sm text-[var(--muted)]">
        Staff email
        <input name="email" type="email" required className={INPUT} />
      </label>
      <label className="mt-4 block text-sm text-[var(--muted)]">
        Password
        <input name="password" type="password" minLength={8} required autoComplete="new-password" className={INPUT} />
      </label>

      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      {created ? <p role="status" className="mt-4 text-sm text-[var(--gold)]">{created}</p> : null}

      <button type="submit" disabled={pending} className="mt-6 w-full rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
        {pending ? "Creating…" : mode === "first" ? "Create Admin account" : "Create staff account"}
      </button>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        <Link href="/admin" className="text-[var(--teal)] underline">
          {mode === "first" ? "Staff sign in" : "Back to Admin"}
        </Link>
      </p>
    </form>
  );
}
