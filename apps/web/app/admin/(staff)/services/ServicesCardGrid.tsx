"use client";

import { SERVICE_LIMITS, type ServiceItem } from "@/lib/domain/service-catalogue";

const CARD =
  "overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)]";

function move(items: ServiceItem[], from: number, to: number): ServiceItem[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Three-across service cards with View, reorder, and remove. */
export function ServicesCardGrid({
  items,
  onOpen,
  onChange,
  onAdd,
}: {
  items: ServiceItem[];
  onOpen: (index: number) => void;
  onChange: (items: ServiceItem[]) => void;
  onAdd: () => void;
}) {
  return (
    <div className="mt-8">
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <li key={`${item.slug}-${index}`} className={CARD}>
            <div className="relative h-44 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
              {item.tag ? (
                <span className="absolute right-3 top-3 rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--navy)]">
                  {item.tag}
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">
                {item.title.trim() || "Untitled service"}
              </p>
              <p className="mt-2 min-h-10 flex-1 text-sm leading-relaxed text-[var(--off-white)]/80">
                {item.summary.trim() || "No summary yet."}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(index)}
                  className="rounded-md bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--navy)] transition hover:brightness-110"
                >
                  View
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onChange(move(items, index, index - 1))}
                  className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2.5 py-2 text-xs font-semibold text-[var(--off-white)] disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => onChange(move(items, index, index + 1))}
                  className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2.5 py-2 text-xs font-semibold text-[var(--off-white)] disabled:opacity-30"
                >
                  →
                </button>
                <button
                  type="button"
                  disabled={items.length <= 1}
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                  className="ml-auto text-xs font-semibold text-[var(--danger)] disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={items.length >= SERVICE_LIMITS.items}
        onClick={onAdd}
        className="mt-6 text-sm font-semibold text-[var(--gold)] disabled:opacity-40"
      >
        + Add a service
        {items.length >= SERVICE_LIMITS.items ? ` (limit ${SERVICE_LIMITS.items})` : ""}
      </button>
    </div>
  );
}
