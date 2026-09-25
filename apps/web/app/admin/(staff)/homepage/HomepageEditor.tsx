"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { HomepageContent } from "@/lib/data/homepage-content";
import {
  Field,
  HomepageListPanels,
} from "@/app/admin/(staff)/homepage/HomepageListPanels";

const TABS = ["Hero", "Features", "Services", "Footer"] as const;
type Tab = (typeof TABS)[number];

type SaveAction = (
  content: HomepageContent,
) => Promise<{ ok: true } | { error: string }>;

/** Tabbed homepage CMS — one section at a time, no clutter. */
export function HomepageEditor({
  initial,
  saveAction,
}: {
  initial: HomepageContent;
  saveAction: SaveAction;
}) {
  const [tab, setTab] = useState<Tab>("Hero");
  const [content, setContent] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function patch(partial: Partial<HomepageContent>) {
    setContent((prev) => ({ ...prev, ...partial }));
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
      setMessage("Saved — public homepage updated.");
    });
  }

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
          <Link
            href="/"
            target="_blank"
            className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline"
          >
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
        {tab === "Hero" ? (
          <>
            <Field label="Headline" value={content.heroHeadline} onChange={(v) => patch({ heroHeadline: v })} rows={2} />
            <Field label="Supporting line" value={content.heroSubhead} onChange={(v) => patch({ heroSubhead: v })} rows={3} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Primary CTA" value={content.ctaBook} onChange={(v) => patch({ ctaBook: v })} />
              <Field label="Quote CTA" value={content.ctaQuote} onChange={(v) => patch({ ctaQuote: v })} />
            </div>
          </>
        ) : null}
        {tab === "Features" || tab === "Services" ? (
          <HomepageListPanels tab={tab} content={content} patch={patch} />
        ) : null}
        {tab === "Footer" ? (
          <Field
            label="Footer tagline"
            value={content.footerTagline}
            onChange={(v) => patch({ footerTagline: v })}
            rows={3}
          />
        ) : null}
      </div>
    </div>
  );
}
