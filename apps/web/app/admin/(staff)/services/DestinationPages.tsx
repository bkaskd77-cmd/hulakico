"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CountryAdd } from "@/app/admin/(staff)/services/CountryAdd";
import { ImageField } from "@/app/admin/(staff)/homepage/ImageField";
import type { LaneCopy, LaneFact } from "@/lib/data/lane-content";

const box =
  "mt-1.5 w-full resize-y rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[color-mix(in_srgb,var(--navy)_70%,transparent)] px-3 py-2.5 text-sm text-[var(--off-white)] outline-none focus:border-[var(--gold)]";
const label = "block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]";

type SaveResult = { ok: true } | { error: string };

/** Destination writing, shown only inside the International Shipping editor. */
export function DestinationPages({
  lanes,
  initialSlug,
  saveAction,
}: {
  lanes: LaneCopy[];
  initialSlug?: string;
  saved?: string;
  saveAction: (formData: FormData) => Promise<SaveResult>;
}) {
  const [slug, setSlug] = useState(initialSlug && lanes.some((lane) => lane.slug === initialSlug) ? initialSlug : lanes[0]?.slug);
  const selected = lanes.find((lane) => lane.slug === slug) ?? lanes[0];
  if (!selected) return null;

  return (
    <section id="destination-pages" className="mt-12 border-t border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pt-8">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">Destination pages</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Pick a lane and write as much as you need. Movement and steps are one point per line. Each box holds up to 100,000 characters.
      </p>
      <CountryAdd saveAction={saveAction} onAdded={setSlug} />
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
      <LaneDraft key={selected.slug} lane={selected} saveAction={saveAction} />
    </section>
  );
}

function LaneDraft({ lane, saveAction }: { lane: LaneCopy; saveAction: (formData: FormData) => Promise<SaveResult> }) {
  const [image, setImage] = useState(lane.image);
  const [facts, setFacts] = useState<LaneFact[]>(lane.facts);
  const [notice, setNotice] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("image", image);
    data.set("facts", JSON.stringify(facts));
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await saveAction(data);
        setFailed("error" in result);
        setNotice("error" in result ? result.error : "Saved. The public lane page now uses this writing.");
      } catch (error) {
        console.error("[DestinationPages.tsx:onSubmit]", error instanceof Error ? error.message : error);
        setFailed(true);
        setNotice("Could not save this destination page.");
      }
      document.getElementById("destination-save")?.scrollIntoView({ block: "center" });
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-3xl space-y-4">
      <input type="hidden" name="slug" value={lane.slug} />
      <ImageField label="Photo" frame="hero" value={image} defaultValue={lane.defaultImage} onChange={setImage} />
      {image ? (
        <button type="button" className="text-xs font-semibold text-[var(--danger)]" onClick={() => setImage("")}>
          Remove photo
        </button>
      ) : (
        <p className="text-xs text-[var(--muted)]">No photo on the public page until you upload one.</p>
      )}
      <label className={label}>Lane brief<textarea name="summary" rows={5} defaultValue={lane.summary} className={box} /></label>
      <label className={label}>How this lane moves — one point per line<textarea name="transit" rows={6} defaultValue={lane.transit} className={box} /></label>
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className={label}>Lane facts</span>
          <button type="button" className="text-xs font-semibold text-[var(--gold)]" onClick={() => setFacts([...facts, { label: "", value: "" }])}>
            Add a fact
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {facts.map((fact, index) => (
            <div key={`${lane.slug}-${index}`} className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
              <input value={fact.label} placeholder="Label" onChange={(event) => setFacts(facts.map((row, i) => (i === index ? { ...row, label: event.target.value } : row)))} className={box} />
              <textarea value={fact.value} rows={2} placeholder="Detail" onChange={(event) => setFacts(facts.map((row, i) => (i === index ? { ...row, value: event.target.value } : row)))} className={box} />
              <button type="button" className="text-xs font-semibold text-[var(--danger)]" onClick={() => setFacts(facts.filter((_, i) => i !== index))}>Remove</button>
            </div>
          ))}
        </div>
      </div>
      <label className={label}>Handover<textarea name="handover" rows={5} defaultValue={lane.handover} className={box} /></label>
      <label className={label}>Receiver<textarea name="paperwork" rows={5} defaultValue={lane.paperwork} className={box} /></label>
      <label className={label}>Steps, one per line<textarea name="steps" rows={5} defaultValue={lane.steps} className={box} /></label>
      <label className={label}>Long article<textarea name="story" rows={8} defaultValue={lane.story} className={box} /></label>
      <div id="destination-save" className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="rounded-md bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
          {pending ? "Saving…" : `Save ${lane.to}`}
        </button>
        {notice ? <p className={`text-sm ${failed ? "text-[var(--danger)]" : "text-[var(--teal)]"}`}>{notice}</p> : null}
      </div>
    </form>
  );
}
