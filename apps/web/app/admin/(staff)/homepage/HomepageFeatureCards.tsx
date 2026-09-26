"use client";

import { useState } from "react";
import { Field } from "@/app/admin/(staff)/homepage/AdminFields";
import { ImageField } from "@/app/admin/(staff)/homepage/ImageField";
import { DEFAULT_FEATURE_IMAGES } from "@/lib/domain/homepage-defaults";
import { HOME_LIMITS, type HomeFeature, type HomepageContent } from "@/lib/domain/homepage-types";

const CARD =
  "overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)]";

function move(items: HomeFeature[], from: number, to: number): HomeFeature[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Feature cards first; View edits one photo, title, and body. */
export function HomepageFeatureCards({
  content,
  patch,
}: {
  content: HomepageContent;
  patch: (partial: Partial<HomepageContent>) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const items = content.features;
  const current = open !== null ? items[open] : null;

  function update(features: HomeFeature[]) {
    patch({ features });
  }

  if (current && open !== null) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
          ← All features
        </button>
        <Field label="Title" value={current.title} onChange={(title) => update(items.map((row, i) => (i === open ? { ...row, title } : row)))} />
        <Field label="Body" value={current.body} rows={3} onChange={(body) => update(items.map((row, i) => (i === open ? { ...row, body } : row)))} />
        <ImageField
          label="Photo"
          frame="card"
          value={current.image}
          defaultValue={DEFAULT_FEATURE_IMAGES[open % DEFAULT_FEATURE_IMAGES.length]}
          onChange={(image) => update(items.map((row, i) => (i === open ? { ...row, image } : row)))}
        />
        <button
          type="button"
          disabled={items.length <= 1}
          onClick={() => {
            update(items.filter((_, i) => i !== open));
            setOpen(null);
          }}
          className="text-sm font-semibold text-[var(--danger)] disabled:opacity-30"
        >
          Remove this feature
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Field label="Eyebrow" value={content.featuresEyebrow} onChange={(v) => patch({ featuresEyebrow: v })} />
      <Field label="Section title" value={content.featuresTitle} onChange={(v) => patch({ featuresTitle: v })} rows={2} />
      <Field label="Intro" value={content.featuresIntro} onChange={(v) => patch({ featuresIntro: v })} rows={3} />
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`} className={CARD}>
            <div className="relative h-28 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
            </div>
            <div className="p-4">
              <p className="font-semibold text-[var(--off-white)]">{item.title.trim() || "Untitled feature"}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setOpen(index)} className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)]">View</button>
                <button type="button" disabled={index === 0} onClick={() => update(move(items, index, index - 1))} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2 py-1.5 text-xs text-[var(--off-white)] disabled:opacity-30">←</button>
                <button type="button" disabled={index === items.length - 1} onClick={() => update(move(items, index, index + 1))} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2 py-1.5 text-xs text-[var(--off-white)] disabled:opacity-30">→</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={items.length >= HOME_LIMITS.features}
        onClick={() => {
          update([...items, { title: "", body: "", image: DEFAULT_FEATURE_IMAGES[items.length % DEFAULT_FEATURE_IMAGES.length] }]);
          setOpen(items.length);
        }}
        className="text-sm font-semibold text-[var(--gold)] disabled:opacity-40"
      >
        + Add a feature
      </button>
    </div>
  );
}
