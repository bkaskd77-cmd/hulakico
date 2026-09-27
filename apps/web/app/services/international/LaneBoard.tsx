"use client";

import Link from "next/link";
import { useState } from "react";
import type { ShippingLane } from "@/lib/domain/international-lanes";

const PAGE_SIZE = 9;

/** Three lane cards across, nine per page, then the next page. */
export function LaneBoard({ lanes }: { lanes: ShippingLane[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(lanes.length / PAGE_SIZE));
  const visible = lanes.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">Lanes from Nepal</p>
      <p className="mt-2 max-w-xl text-sm text-[var(--off-white)]/80">
        Open a destination for the documents, timing, and what we need on that lane.
      </p>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((lane) => (
          <li key={lane.slug}>
            <Link
              href={`/services/international/${lane.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] transition hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--gold)_55%,transparent)]"
            >
              <div className="relative h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lane.image} alt="" className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105" />
                <span className="absolute bottom-3 left-3 rounded-full bg-[var(--navy)]/90 px-2.5 py-1 text-[11px] font-semibold text-[var(--gold)]">
                  Nepal → {lane.to}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">{lane.title}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--off-white)]/75">{lane.summary}</p>
                <p className="mt-4 text-sm font-semibold text-[var(--gold)]">View lane →</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {pageCount > 1 ? (
        <div className="mt-6 flex items-center gap-2">
          <button type="button" disabled={page === 0} onClick={() => setPage((n) => n - 1)} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--off-white)] disabled:opacity-30">
            Previous
          </button>
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPage(index)}
              className={`h-8 w-8 rounded-md text-xs font-semibold ${index === page ? "bg-[var(--gold)] text-[var(--navy)]" : "text-[var(--off-white)]"}`}
            >
              {index + 1}
            </button>
          ))}
          <button type="button" disabled={page === pageCount - 1} onClick={() => setPage((n) => n + 1)} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--off-white)] disabled:opacity-30">
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
