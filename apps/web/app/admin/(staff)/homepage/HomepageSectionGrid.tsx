"use client";

import type { HomepageContent } from "@/lib/domain/homepage-types";

export type HomeEditSection = "hero" | "highlights" | "services" | "features" | "footer" | "layout";

const CARDS: { id: HomeEditSection; title: string; blurb: (content: HomepageContent) => string }[] = [
  { id: "hero", title: "Hero", blurb: (c) => c.heroHeadline },
  { id: "highlights", title: "Highlights", blurb: (c) => `${c.towerAlerts.length} lines` },
  { id: "services", title: "Services heading", blurb: (c) => c.servicesTitle },
  { id: "features", title: "Features", blurb: (c) => `${c.features.length} cards` },
  { id: "footer", title: "Footer", blurb: (c) => c.footerTagline },
  { id: "layout", title: "Order and visibility", blurb: () => "Reorder or hide the blocks under the hero" },
];

const CARD =
  "flex h-full flex-col overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-5";

/** Homepage sections as cards. View opens one section. */
export function HomepageSectionGrid({
  content,
  onOpen,
}: {
  content: HomepageContent;
  onOpen: (id: HomeEditSection) => void;
}) {
  return (
    <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((card) => (
        <li key={card.id} className={CARD}>
          <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">{card.title}</p>
          <p className="mt-2 min-h-10 flex-1 text-sm leading-relaxed text-[var(--off-white)]/80">{card.blurb(content)}</p>
          <button
            type="button"
            onClick={() => onOpen(card.id)}
            className="mt-5 w-fit rounded-md bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--navy)] transition hover:brightness-110"
          >
            View
          </button>
        </li>
      ))}
    </ul>
  );
}
