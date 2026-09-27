"use client";

import { useState } from "react";
import type { LaneCopy } from "@/lib/data/lane-content";

const box =
  "mt-1.5 w-full resize-y rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[color-mix(in_srgb,var(--navy)_70%,transparent)] px-3 py-2.5 text-sm text-[var(--off-white)] outline-none focus:border-[var(--gold)]";

/** Destination writing, shown only inside the International Shipping editor. */
export function DestinationPages({
  lanes,
  initialSlug,
  saved,
  saveAction,
}: {
  lanes: LaneCopy[];
  initialSlug?: string;
  saved?: string;
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const [slug, setSlug] = useState(initialSlug && lanes.some((lane) => lane.slug === initialSlug) ? initialSlug : lanes[0]?.slug);
  const selected = lanes.find((lane) => lane.slug === slug) ?? lanes[0];
  if (!selected) return null;

  return (
    <section className="mt-12 border-t border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pt-8">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">Destination pages</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Pick a lane and write as much as you need. Each box holds up to 100,000 characters. One step per line.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {lanes.map((lane) => (
          <button
            key={lane.slug}
            type="button"
            onClick={() => setSlug(lane.slug)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${lane.slug === selected.slug ? "bg-[var(--gold)] text-[var(--navy)]" : "text-[var(--off-white)] ring-1 ring-[color-mix(in_srgb,var(--off-white)_25%,transparent)]"}`}
          >
            {lane.to}
          </button>
        ))}
      </div>
      <form action={saveAction} key={selected.slug} className="mt-6 max-w-3xl space-y-4">
        <input type="hidden" name="slug" value={selected.slug} />
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Lane brief
          <textarea name="summary" rows={6} defaultValue={selected.summary} className={box} />
        </label>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          How this lane moves
          <textarea name="transit" rows={8} defaultValue={selected.transit} className={box} />
        </label>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Receiver
          <textarea name="paperwork" rows={8} defaultValue={selected.paperwork} className={box} />
        </label>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Steps, one per line
          <textarea name="steps" rows={8} defaultValue={selected.steps} className={box} />
        </label>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Long article
          <textarea name="story" rows={16} defaultValue={selected.story} className={box} />
        </label>
        <button type="submit" className="rounded-md bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--navy)]">
          Save {selected.to}
        </button>
        {saved === "saved" && selected.slug === initialSlug ? <p className="text-sm text-[var(--teal)]">Saved. The public lane page now uses this writing.</p> : null}
        {(saved === "error" || saved === "denied") && selected.slug === initialSlug ? <p className="text-sm text-[var(--danger)]">Could not save this destination page.</p> : null}
      </form>
    </section>
  );
}
