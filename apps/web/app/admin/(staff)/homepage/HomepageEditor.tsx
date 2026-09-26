"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { HomepageFeatureCards } from "@/app/admin/(staff)/homepage/HomepageFeatureCards";
import { HomepageFooterPanel } from "@/app/admin/(staff)/homepage/HomepageFooterPanel";
import { HomepageHeroPanel } from "@/app/admin/(staff)/homepage/HomepageHeroPanel";
import { HomepageLayoutPanel } from "@/app/admin/(staff)/homepage/HomepageLayoutPanel";
import {
  HomepageHighlightsPanel,
  HomepageServicesPanel,
} from "@/app/admin/(staff)/homepage/HomepageListPanels";
import {
  HomepageSectionGrid,
  type HomeEditSection,
} from "@/app/admin/(staff)/homepage/HomepageSectionGrid";
import type { HomepageContent } from "@/lib/domain/homepage-types";

type SaveAction = (content: HomepageContent) => Promise<{ ok: true } | { error: string }>;

/** Section cards first; View opens one block. Save publishes the homepage. */
export function HomepageEditor({
  initial,
  saveAction,
}: {
  initial: HomepageContent;
  saveAction: SaveAction;
}) {
  const [open, setOpen] = useState<HomeEditSection | null>(null);
  const [content, setContent] = useState(initial);
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

  function patch(partial: Partial<HomepageContent>) {
    setContent((prev) => ({ ...prev, ...partial }));
    setDirty(true);
    setMessage(null);
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveAction(content);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDirty(false);
      setMessage("Saved — public homepage updated.");
    });
  }

  const panel = { content, patch };
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pb-5">
        {dirty ? <span className="text-xs font-semibold text-[var(--gold)]">Unsaved changes</span> : null}
        <Link href="/" target="_blank" className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
          Preview /
        </Link>
        <button type="button" onClick={save} disabled={pending} className="rounded-md bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110 disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-[var(--gold)]">{message}</p> : null}
      {open ? (
        <div className="mt-8 max-w-2xl space-y-5">
          <button type="button" onClick={() => setOpen(null)} className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
            ← All sections
          </button>
          {open === "hero" ? <HomepageHeroPanel {...panel} /> : null}
          {open === "highlights" ? <HomepageHighlightsPanel {...panel} /> : null}
          {open === "services" ? <HomepageServicesPanel {...panel} /> : null}
          {open === "features" ? <HomepageFeatureCards {...panel} /> : null}
          {open === "footer" ? <HomepageFooterPanel {...panel} /> : null}
          {open === "layout" ? <HomepageLayoutPanel {...panel} /> : null}
        </div>
      ) : (
        <HomepageSectionGrid content={content} onOpen={setOpen} />
      )}
    </div>
  );
}
