"use client";

import { FIELD, Field, SectionNote } from "@/app/admin/(staff)/homepage/AdminFields";
import { PageSectionEditor } from "@/app/admin/(staff)/pages/PageSectionEditor";
import { PAGE_GROUPS, type SitePage } from "@/lib/domain/page-catalogue";

/** One page: footer group, copy, then its sections as cards. */
export function PageEditForm({
  item,
  onChange,
  onBack,
  onRemove,
}: {
  item: SitePage;
  onChange: (item: SitePage) => void;
  onBack: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-8 max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
          ← All pages
        </button>
        {item.standalone ? null : (
          <button type="button" onClick={onRemove} className="text-sm font-semibold text-[var(--danger)]">
            Remove this page
          </button>
        )}
      </div>
      {item.standalone ? (
        <SectionNote>Contact keeps its own form page. This card sets the footer label and group.</SectionNote>
      ) : null}
      <Field label="Title" value={item.title} onChange={(title) => onChange({ ...item, title })} />
      <Field label="URL slug" value={item.slug} placeholder="about" onChange={(slug) => onChange({ ...item, slug: item.standalone ? item.slug : slug })} />
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Footer group</span>
        <select className={FIELD} value={item.group} onChange={(event) => onChange({ ...item, group: event.target.value as SitePage["group"] })}>
          {PAGE_GROUPS.map((group) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </label>
      <Field label="Intro" value={item.intro} rows={3} onChange={(intro) => onChange({ ...item, intro })} />
      <Field label="Updated line (optional)" value={item.updated} placeholder="September 25, 2026" onChange={(updated) => onChange({ ...item, updated })} />
      {item.standalone ? null : (
        <PageSectionEditor sections={item.sections} onChange={(sections) => onChange({ ...item, sections })} />
      )}
    </div>
  );
}
