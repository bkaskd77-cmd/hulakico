"use client";

import { useEffect, useState, useTransition } from "react";
import { PageEditForm } from "@/app/admin/(staff)/pages/PageEditForm";
import { PagesCardGrid } from "@/app/admin/(staff)/pages/PagesCardGrid";
import { blankPage, type SitePage } from "@/lib/domain/page-catalogue";

type SaveAction = (items: SitePage[]) => Promise<{ ok: true } | { error: string }>;

/** Card grid first; View opens one company, support, or legal page. */
export function PagesEditor({ initial, saveAction }: { initial: SitePage[]; saveAction: SaveAction }) {
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

  function update(next: SitePage[]) {
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
      setMessage("Saved — footer links and public pages updated.");
    });
  }

  const current = open !== null ? items[open] : null;
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pb-5">
        {dirty ? <span className="text-xs font-semibold text-[var(--gold)]">Unsaved changes</span> : null}
        <button type="button" onClick={save} disabled={pending} className="rounded-md bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-[var(--gold)]">{message}</p> : null}
      {current && open !== null ? (
        <PageEditForm
          item={current}
          onBack={() => setOpen(null)}
          onChange={(item) => update(items.map((row, i) => (i === open ? item : row)))}
          onRemove={() => {
            update(items.filter((_, i) => i !== open));
            setOpen(null);
          }}
        />
      ) : (
        <PagesCardGrid
          items={items}
          onOpen={setOpen}
          onChange={update}
          onAdd={() => {
            update([...items, blankPage()]);
            setOpen(items.length);
          }}
        />
      )}
    </div>
  );
}
