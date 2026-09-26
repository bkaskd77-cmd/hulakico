"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { HomepageContent } from "@/lib/domain/homepage-types";
import { HomepageFooterPanel } from "@/app/admin/(staff)/homepage/HomepageFooterPanel";
import { HomepageHeroPanel } from "@/app/admin/(staff)/homepage/HomepageHeroPanel";
import { HomepageLayoutPanel } from "@/app/admin/(staff)/homepage/HomepageLayoutPanel";
import {
  HomepageFeaturesPanel,
  HomepageHighlightsPanel,
  HomepageServicesPanel,
} from "@/app/admin/(staff)/homepage/HomepageListPanels";

const TABS = ["Layout", "Hero", "Highlights", "Services", "Features", "Footer"] as const;
type Tab = (typeof TABS)[number];

type SaveAction = (
  content: HomepageContent,
) => Promise<{ ok: true } | { error: string }>;

/** Tabbed homepage CMS — one section at a time; nothing goes live until Save. */
export function HomepageEditor({
  initial,
  saveAction,
}: {
  initial: HomepageContent;
  saveAction: SaveAction;
}) {
  const [tab, setTab] = useState<Tab>("Layout");
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

  const panelProps = { content, patch };
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pb-5">
        <nav className="flex flex-wrap gap-1" aria-label="Homepage sections">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                tab === name
                  ? "bg-[var(--gold)] text-[var(--navy)]"
                  : "text-[var(--muted)] hover:text-[var(--off-white)]"
              }`}
            >
              {name}
            </button>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-3">
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
      </div>

      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-[var(--gold)]">{message}</p> : null}

      <div className="mt-8 max-w-2xl space-y-5">
        {tab === "Layout" ? <HomepageLayoutPanel {...panelProps} /> : null}
        {tab === "Hero" ? <HomepageHeroPanel {...panelProps} /> : null}
        {tab === "Highlights" ? <HomepageHighlightsPanel {...panelProps} /> : null}
        {tab === "Services" ? <HomepageServicesPanel {...panelProps} /> : null}
        {tab === "Features" ? <HomepageFeaturesPanel {...panelProps} /> : null}
        {tab === "Footer" ? <HomepageFooterPanel {...panelProps} /> : null}
      </div>
    </div>
  );
}
