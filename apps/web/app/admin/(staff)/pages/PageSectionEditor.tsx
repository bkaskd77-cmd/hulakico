"use client";

import { useState } from "react";
import { Field } from "@/app/admin/(staff)/homepage/AdminFields";
import { EditableList } from "@/app/admin/(staff)/homepage/EditableList";
import { PAGE_LIMITS, blankSection } from "@/lib/domain/page-catalogue";
import type { InfoSection } from "@/lib/data/info-pages";

const CARD =
  "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-4";

function move(items: InfoSection[], from: number, to: number): InfoSection[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Section cards inside one page. View edits that heading and its paragraphs. */
export function PageSectionEditor({
  sections,
  onChange,
}: {
  sections: InfoSection[];
  onChange: (sections: InfoSection[]) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const current = open !== null ? sections[open] : null;

  if (current && open !== null) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
          ← Back to this page
        </button>
        <Field label="Heading" value={current.heading} onChange={(heading) => onChange(sections.map((row, i) => (i === open ? { ...row, heading } : row)))} />
        <EditableList
          itemLabel="Paragraph"
          items={current.body}
          max={PAGE_LIMITS.paragraphs}
          blank={() => ""}
          onChange={(body) => onChange(sections.map((row, i) => (i === open ? { ...row, body } : row)))}
          renderItem={(line, setLine) => <Field label="Text" value={line} rows={3} onChange={setLine} />}
        />
        <button
          type="button"
          onClick={() => {
            onChange(sections.filter((_, i) => i !== open));
            setOpen(null);
          }}
          className="text-sm font-semibold text-[var(--danger)]"
        >
          Remove this section
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Sections</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {sections.map((section, index) => (
          <li key={`${section.heading}-${index}`} className={CARD}>
            <p className="font-semibold text-[var(--off-white)]">{section.heading.trim() || "Untitled section"}</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setOpen(index)} className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)]">View</button>
              <button type="button" disabled={index === 0} onClick={() => onChange(move(sections, index, index - 1))} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2 py-1.5 text-xs text-[var(--off-white)] disabled:opacity-30">←</button>
              <button type="button" disabled={index === sections.length - 1} onClick={() => onChange(move(sections, index, index + 1))} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2 py-1.5 text-xs text-[var(--off-white)] disabled:opacity-30">→</button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={sections.length >= PAGE_LIMITS.sections}
        onClick={() => {
          onChange([...sections, blankSection()]);
          setOpen(sections.length);
        }}
        className="text-sm font-semibold text-[var(--gold)] disabled:opacity-40"
      >
        + Add a section
      </button>
    </div>
  );
}
