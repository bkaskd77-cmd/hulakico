"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

const box =
  "mt-1.5 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[color-mix(in_srgb,var(--navy)_70%,transparent)] px-3 py-2.5 text-sm text-[var(--off-white)] outline-none focus:border-[var(--gold)]";
const label = "block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]";

type SaveResult = { ok: true } | { error: string };

/** Adds one shipping country and opens it in the destination editor. */
export function CountryAdd({
  saveAction,
  onAdded,
}: {
  saveAction: (formData: FormData) => Promise<SaveResult>;
  onAdded: (slug: string) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const to = name.trim();
    const slug = to.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
    if (slug.length < 2) {
      setError("Enter a country name.");
      return;
    }
    const data = new FormData();
    const fields: Record<string, string> = {
      create: "1", slug, to, title: `Nepal to ${to}`, summary: `Shipments from Kathmandu to ${to}.`,
      transit: "The quote shows the delivery window before you book.", paperwork: `A full receiver address in ${to}.`,
      handover: "Bring the box to the Kathmandu desk, or ask for a pickup when you quote.",
      steps: "Send the city, weight, and whether the box is documents or goods.\nBook, then hand the box over in Kathmandu.\nFollow one Hulakico timeline.",
      story: "", image: "", facts: JSON.stringify([{ label: "Route", value: `Kathmandu, Nepal → ${to}` }, { label: "Rate", value: "No fixed fare. The quote sets the price." }]),
    };
    Object.entries(fields).forEach(([key, value]) => data.set(key, value));
    startTransition(async () => {
      try {
        const result = await saveAction(data);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setName("");
        setError(null);
        onAdded(slug);
        router.refresh();
      } catch (err) {
        console.error("[CountryAdd.tsx:add]", err instanceof Error ? err.message : err);
        setError("Could not add that country.");
      }
    });
  }

  return (
    <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-3">
      <label className={label}>
        Add a country
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Canada" className={box} />
      </label>
      <button type="submit" disabled={pending} className="rounded-md bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
        {pending ? "Adding…" : "Add country"}
      </button>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </form>
  );
}
