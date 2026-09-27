"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { DestinationPages } from "@/app/admin/(staff)/services/DestinationPages";
import { ServiceEditForm } from "@/app/admin/(staff)/services/ServiceEditForm";
import { ServicesCardGrid } from "@/app/admin/(staff)/services/ServicesCardGrid";
import { saveCityAction } from "@/app/admin/(staff)/services/city-action";
import type { LaneCopy } from "@/lib/data/lane-content";
import { blankService, type ServiceItem } from "@/lib/domain/service-catalogue";

type SaveAction = (items: ServiceItem[]) => Promise<{ ok: true } | { error: string }>;

/** Card grid first; View opens one service for editing. */
export function ServicesEditor({
  initial,
  saveAction,
  lanes,
  initialLane,
  laneSaved,
  saveLaneAction,
  cities,
  initialCity,
}: {
  initial: ServiceItem[];
  saveAction: SaveAction;
  lanes: LaneCopy[];
  initialLane?: string;
  laneSaved?: string;
  saveLaneAction: (formData: FormData) => Promise<{ ok: true } | { error: string }>;
  cities: LaneCopy[];
  initialCity?: string;
}) {
  const internationalIndex = initial.findIndex((item) => item.slug === "international");
  const domesticIndex = initial.findIndex((item) => item.slug === "domestic");
  const opened = initialLane && internationalIndex >= 0 ? internationalIndex : initialCity && domesticIndex >= 0 ? domesticIndex : null;
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<number | null>(opened);
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

  function add() {
    const next = [...items, blankService()];
    update(next);
    setOpen(next.length - 1);
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
      setMessage("Saved — homepage cards, menus, and detail pages updated.");
    });
  }

  const current = open !== null ? items[open] : null;
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
      {current && open !== null ? (
        <>
          <ServiceEditForm
            item={current}
            canRemove={items.length > 1}
            onBack={() => setOpen(null)}
            onChange={(item) => update(items.map((row, i) => (i === open ? item : row)))}
            onRemove={() => {
              update(items.filter((_, i) => i !== open));
              setOpen(null);
            }}
          />
          {current.slug === "international" ? (
            <DestinationPages lanes={lanes} initialSlug={initialLane} saved={laneSaved} saveAction={saveLaneAction} />
          ) : null}
          {current.slug === "domestic" ? (
            <DestinationPages
              lanes={cities}
              initialSlug={initialCity}
              saveAction={saveCityAction}
              heading="City pages"
              intro="Pick a city and write as much as you need. Movement and steps are one point per line. Each box holds up to 100,000 characters."
              kind="city"
              savedNotice="Saved. The public city page now uses this writing."
            />
          ) : null}
        </>
      ) : (
        <ServicesCardGrid items={items} onOpen={setOpen} onChange={update} onAdd={add} />
      )}
    </div>
  );
}
