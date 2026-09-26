"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Field } from "@/app/admin/(staff)/homepage/AdminFields";
import { EditableList } from "@/app/admin/(staff)/homepage/EditableList";
import { ImageField } from "@/app/admin/(staff)/homepage/ImageField";
import {
  SERVICE_LIMITS,
  blankService,
  type ServiceItem,
} from "@/lib/domain/service-catalogue";

type SaveAction = (items: ServiceItem[]) => Promise<{ ok: true } | { error: string }>;

/** Add, remove, reorder, and edit service cards plus their detail-page copy. */
export function ServicesEditor({
  initial,
  saveAction,
}: {
  initial: ServiceItem[];
  saveAction: SaveAction;
}) {
  const [items, setItems] = useState(initial);
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

  function update(next: ServiceItem[]) {
    setItems(next);
    setDirty(true);
    setMessage(null);
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveAction(items);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDirty(false);
      setMessage("Saved — catalogue stored. Public pages still use the current seed until they are wired.");
    });
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pb-5">
        {dirty ? <span className="text-xs font-semibold text-[var(--gold)]">Unsaved changes</span> : null}
        <Link href="/" target="_blank" className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
          Preview /
        </Link>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-md bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-[var(--gold)]">{message}</p> : null}
      <div className="mt-8 max-w-2xl">
        <EditableList
          itemLabel="Service"
          items={items}
          max={SERVICE_LIMITS.items}
          blank={blankService}
          onChange={update}
          renderItem={(item, patch) => (
            <div className="space-y-3">
              <Field label="Title" value={item.title} onChange={(title) => patch({ ...item, title })} />
              <Field label="URL slug" value={item.slug} placeholder="domestic" onChange={(slug) => patch({ ...item, slug })} />
              <Field label="Tag (optional)" value={item.tag} placeholder="Popular" onChange={(tag) => patch({ ...item, tag })} />
              <ImageField label="Photo" frame="card" value={item.image} defaultValue={item.image} onChange={(image) => patch({ ...item, image })} />
              <Field label="Card summary" value={item.summary} rows={2} onChange={(summary) => patch({ ...item, summary })} />
              <Field label="Page intro" value={item.intro} rows={3} onChange={(intro) => patch({ ...item, intro })} />
              <EditableList itemLabel="Highlight" items={item.highlights} max={SERVICE_LIMITS.highlights} blank={() => ""} onChange={(highlights) => patch({ ...item, highlights })} renderItem={(line, setLine) => <Field label="Text" value={line} onChange={setLine} />} />
              <EditableList itemLabel="Need" items={item.needs} max={SERVICE_LIMITS.needs} blank={() => ""} onChange={(needs) => patch({ ...item, needs })} renderItem={(line, setLine) => <Field label="Text" value={line} onChange={setLine} />} />
              <EditableList itemLabel="Step" items={item.howItWorks} max={SERVICE_LIMITS.howItWorks} blank={() => ""} onChange={(howItWorks) => patch({ ...item, howItWorks })} renderItem={(line, setLine) => <Field label="Text" value={line} onChange={setLine} />} />
            </div>
          )}
        />
      </div>
    </div>
  );
}
