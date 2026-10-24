"use client";

import { useEffect, useState, useTransition } from "react";
import { FIELD, Field, LABEL } from "@/app/admin/(staff)/homepage/AdminFields";
import type { ContactPhone, ContactSettings } from "@/lib/data/company-contact-content";

type SaveAction = (input: ContactSettings) => Promise<{ ok: true } | { error: string }>;

const MAX_PHONES = 4;
const CARD = "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5";
const SMALL_BUTTON = "rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--off-white)] hover:border-[var(--gold)]";

/** Edit the company phones, email, WhatsApp, address, and map link. */
export function ContactEditor({ initial, saveAction }: { initial: ContactSettings; saveAction: SaveAction }) {
  const [form, setForm] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(next: Partial<ContactSettings>) {
    setForm((prev) => ({ ...prev, ...next }));
    setDirty(true);
    setMessage(null);
  }

  function changePhone(index: number, next: Partial<ContactPhone>) {
    change({ phones: form.phones.map((p, i) => (i === index ? { ...p, ...next } : p)) });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveAction(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDirty(false);
      setMessage("Saved. The website now shows these contact details.");
    });
  }

  return (
    <div className="mt-8 max-w-2xl space-y-5">
      <section className={CARD}>
        <Field label="Company name" value={form.name} onChange={(name) => change({ name })} />
      </section>

      <section className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <span className={LABEL}>Phone numbers</span>
          {form.phones.length < MAX_PHONES ? (
            <button type="button" className={SMALL_BUTTON} onClick={() => change({ phones: [...form.phones, { label: "", number: "" }] })}>Add phone</button>
          ) : null}
        </div>
        <div className="mt-3 space-y-3">
          {form.phones.map((phone, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-end">
              <input className={FIELD} aria-label={`Phone ${index + 1} label`} placeholder="Mobile" value={phone.label} onChange={(e) => changePhone(index, { label: e.target.value })} />
              <input className={FIELD} aria-label={`Phone ${index + 1} number`} placeholder="+977 985-0000000" inputMode="tel" value={phone.number} onChange={(e) => changePhone(index, { number: e.target.value })} />
              <button type="button" className={SMALL_BUTTON} onClick={() => change({ phones: form.phones.filter((_, i) => i !== index) })}>Remove</button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Include the country code. Shown exactly as typed; tap-to-call uses the digits.</p>
      </section>

      <section className={`${CARD} grid gap-4 sm:grid-cols-2`}>
        <Field label="Email" value={form.email} onChange={(email) => change({ email })} placeholder="info@hulakico.com" />
        <Field label="WhatsApp number" value={form.whatsapp} onChange={(whatsapp) => change({ whatsapp })} placeholder="+977 985-0000000" />
      </section>

      <section className={CARD}>
        <Field
          label="Office address (one line per row)"
          rows={3}
          value={form.address.join("\n")}
          onChange={(value) => change({ address: value.split("\n") })}
        />
        <div className="mt-4">
          <Field label="Map link (Google Maps or OpenStreetMap)" value={form.mapsUrl} onChange={(mapsUrl) => change({ mapsUrl })} placeholder="https://www.google.com/maps/search/?api=1&query=…" />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="rounded-md bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
        {dirty ? <span className="text-xs font-semibold text-[var(--gold)]">Unsaved changes</span> : null}
        {message ? <span role="status" className="text-sm text-[var(--teal)]">{message}</span> : null}
        {error ? <span role="alert" className="text-sm text-[var(--danger)]">{error}</span> : null}
      </div>
    </div>
  );
}
