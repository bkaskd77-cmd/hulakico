"use client";

import { FormEvent, useState } from "react";
import { CONTACT_TOPICS } from "@/lib/domain/contact";

const fieldClass =
  "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2.5 text-[var(--off-white)] focus:border-[var(--teal)] focus:outline-none";

/** Public contact form — posts to /api/contact. */
export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not send your message.");
        return;
      }
      setSent(true);
    } catch (err) {
      console.error("[ContactForm.tsx:onSubmit]", err);
      setError("Could not send your message. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="hub-rank-item mt-6 rounded-md border border-[color-mix(in_srgb,var(--teal)_45%,transparent)] bg-[color-mix(in_srgb,var(--teal)_12%,transparent)] p-5">
        <p className="font-semibold text-[var(--off-white)]">Message received.</p>
        <p className="mt-1 text-sm text-[var(--off-white)]/85">Thank you — the Hulakico team will get back to you by email.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-4 text-sm text-[var(--gold)] underline">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-[var(--muted)]">
          Full name
          <input name="name" required minLength={2} maxLength={80} className={fieldClass} />
        </label>
        <label className="block text-sm text-[var(--muted)]">
          Email
          <input name="email" type="email" required maxLength={120} className={fieldClass} />
        </label>
        <label className="block text-sm text-[var(--muted)]">
          Phone (optional)
          <input name="phone" type="tel" maxLength={30} className={fieldClass} />
        </label>
        <label className="block text-sm text-[var(--muted)]">
          Topic
          <select name="topic" defaultValue="GENERAL" className={fieldClass}>
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>{topic.label}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm text-[var(--muted)]">
        Hulakico AWB (optional)
        <input name="reference" maxLength={60} placeholder="If this is about a shipment" className={fieldClass} />
      </label>
      <label className="block text-sm text-[var(--muted)]">
        Message
        <textarea name="message" required minLength={10} maxLength={2000} rows={5} className={fieldClass} />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110 disabled:opacity-60">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
