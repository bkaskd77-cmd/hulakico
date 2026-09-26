"use client";

import { PAGE_LIMITS, type SitePage } from "@/lib/domain/page-catalogue";

const CARD =
  "flex h-full flex-col rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-5";

function move(items: SitePage[], from: number, to: number): SitePage[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Page cards in three columns. View opens one page. */
export function PagesCardGrid({
  items,
  onOpen,
  onChange,
  onAdd,
}: {
  items: SitePage[];
  onOpen: (index: number) => void;
  onChange: (items: SitePage[]) => void;
  onAdd: () => void;
}) {
  return (
    <div className="mt-8">
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <li key={`${item.slug}-${index}`} className={CARD}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">{item.group}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">
              {item.title.trim() || "Untitled page"}
            </p>
            <p className="mt-2 min-h-10 flex-1 text-sm leading-relaxed text-[var(--off-white)]/80">
              {item.intro.trim() || "No intro yet."}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => onOpen(index)} className="rounded-md bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--navy)]">
                View
              </button>
              <button type="button" disabled={index === 0} onClick={() => onChange(move(items, index, index - 1))} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2.5 py-2 text-xs text-[var(--off-white)] disabled:opacity-30">←</button>
              <button type="button" disabled={index === items.length - 1} onClick={() => onChange(move(items, index, index + 1))} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2.5 py-2 text-xs text-[var(--off-white)] disabled:opacity-30">→</button>
              <button type="button" disabled={items.length <= 1 || item.standalone} onClick={() => onChange(items.filter((_, i) => i !== index))} className="ml-auto text-xs font-semibold text-[var(--danger)] disabled:opacity-30">
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" disabled={items.length >= PAGE_LIMITS.items} onClick={onAdd} className="mt-6 text-sm font-semibold text-[var(--gold)] disabled:opacity-40">
        + Add a page
      </button>
    </div>
  );
}
