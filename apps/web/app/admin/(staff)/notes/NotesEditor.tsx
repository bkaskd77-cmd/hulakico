"use client";

import { useEffect, useState, useTransition } from "react";
import { FIELD, Field } from "@/app/admin/(staff)/homepage/AdminFields";
import { ImageField } from "@/app/admin/(staff)/homepage/ImageField";
import type { NoteKind, StoredNote } from "@/lib/data/desk-notes-content";

type SaveAction = (items: StoredNote[]) => Promise<{ ok: true } | { error: string }>;

const PLACES: { id: NoteKind; label: string }[] = [
  { id: "update", label: "Homepage update" },
  { id: "story", label: "Homepage story" },
  { id: "more", label: "Library only" },
];

function words(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function blank(index: number): StoredNote {
  return { slug: `new-note-${index}`, title: "New note", kicker: "Desk", excerpt: "", image: "/home/feature-1.jpg", extraImage: "", kind: "more", lead: "", body: "", points: [] };
}

/** Place, edit, add, and remove desk notes. The story field holds a long article. */
export function NotesEditor({ initial, saveAction }: { initial: StoredNote[]; saveAction: SaveAction }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<number | null>(null);
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

  function update(next: StoredNote[]) {
    setItems(next);
    setDirty(true);
    setMessage(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveAction(items);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDirty(false);
      setMessage("Saved. The homepage and note pages now use this library.");
    });
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    update(next);
  }

  const current = open !== null ? items[open] : null;
  const count = current ? words(current.body) : 0;
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pb-5">
        <p className="max-w-xl text-sm text-[var(--muted)]">First three updates and first two stories appear on the homepage, in this order.</p>
        <div className="flex items-center gap-3">
          {dirty ? <span className="text-xs font-semibold text-[var(--gold)]">Unsaved changes</span> : null}
          <button type="button" onClick={save} disabled={pending} className="rounded-md bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">{pending ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-[var(--teal)]">{message}</p> : null}
      {current && open !== null ? (
        <div className="mt-6 space-y-4">
          <button type="button" className="text-sm font-semibold text-[var(--gold)]" onClick={() => setOpen(null)}>Back to the list</button>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" value={current.title} onChange={(title) => update(items.map((row, i) => (i === open ? { ...row, title } : row)))} />
            <Field label="Web address" value={current.slug} onChange={(slug) => update(items.map((row, i) => (i === open ? { ...row, slug } : row)))} />
            <Field label="Label" value={current.kicker} onChange={(kicker) => update(items.map((row, i) => (i === open ? { ...row, kicker } : row)))} />
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Place</span>
              <select className={FIELD} value={current.kind} onChange={(event) => update(items.map((row, i) => (i === open ? { ...row, kind: event.target.value as NoteKind } : row)))}>
                {PLACES.map((place) => <option key={place.id} value={place.id}>{place.label}</option>)}
              </select>
            </label>
          </div>
          <Field label="Card summary" value={current.excerpt} onChange={(excerpt) => update(items.map((row, i) => (i === open ? { ...row, excerpt } : row)))} rows={2} />
          <Field label="Opening paragraph" value={current.lead} onChange={(lead) => update(items.map((row, i) => (i === open ? { ...row, lead } : row)))} rows={3} />
          <ImageField label="Cover photo" value={current.image} defaultValue="" frame="hero" onChange={(image) => update(items.map((row, i) => (i === open ? { ...row, image } : row)))} />
          <ImageField label="Photo inside the article" value={current.extraImage} defaultValue="" frame="card" onChange={(extraImage) => update(items.map((row, i) => (i === open ? { ...row, extraImage } : row)))} />
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Full story · {count} words</span>
            <textarea className={`${FIELD} min-h-[22rem] resize-y`} rows={18} maxLength={12000} value={current.body} placeholder={"# A heading\n\nWrite the paragraph. A blank line starts the next one. 1000 words fit in this box."} onChange={(event) => update(items.map((row, i) => (i === open ? { ...row, body: event.target.value } : row)))} />
            <span className="mt-1 block text-xs text-[var(--muted)]">{count >= 1000 ? "Long enough for a full note." : "Room for 1000 words or more."} Start a line with # and a space to make a heading.</span>
          </label>
          <Field label="Checklist, one line each" value={current.points.join("\n")} onChange={(value) => update(items.map((row, i) => (i === open ? { ...row, points: value.split("\n").slice(0, 8) } : row)))} rows={4} />
          <button type="button" className="text-sm font-semibold text-[var(--danger)]" onClick={() => { update(items.filter((_, i) => i !== open)); setOpen(null); }}>Remove this note</button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((note, index) => (
            <div key={`${note.slug}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy-elevated)] px-4 py-3">
              <div>
                <p className="font-semibold text-[var(--off-white)]">{note.title || "Untitled"}</p>
                <p className="text-xs text-[var(--muted)]">{PLACES.find((place) => place.id === note.kind)?.label} · /notes/{note.slug}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--off-white)]" onClick={() => move(index, -1)}>Up</button>
                <button type="button" className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--off-white)]" onClick={() => move(index, 1)}>Down</button>
                <button type="button" className="rounded-md border border-[var(--gold)] px-3 py-1 text-xs font-semibold text-[var(--gold)]" onClick={() => setOpen(index)}>Edit</button>
              </div>
            </div>
          ))}
          <button type="button" className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]" onClick={() => { update([...items, blank(items.length + 1)]); setOpen(items.length); }}>Add a note</button>
        </div>
      )}
    </div>
  );
}
