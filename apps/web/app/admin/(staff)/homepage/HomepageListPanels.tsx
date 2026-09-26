"use client";

import type { HomepageContent, HomeFeature, HomeService } from "@/lib/data/homepage-content";

export const FIELD =
  "mt-1.5 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[color-mix(in_srgb,var(--navy)_70%,transparent)] px-3 py-2.5 text-sm text-[var(--off-white)] outline-none transition focus:border-[var(--gold)]";
export const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]";

export function Field({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {rows ? (
        <textarea className={`${FIELD} min-h-[5.5rem] resize-y`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={FIELD} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

/** Features / services list editors for the homepage CMS. */
export function HomepageListPanels({
  tab,
  content,
  patch,
}: {
  tab: "Features" | "Services";
  content: HomepageContent;
  patch: (partial: Partial<HomepageContent>) => void;
}) {
  if (tab === "Features") {
    return (
      <>
        <Field label="Eyebrow" value={content.featuresEyebrow} onChange={(v) => patch({ featuresEyebrow: v })} />
        <Field label="Section title" value={content.featuresTitle} onChange={(v) => patch({ featuresTitle: v })} rows={2} />
        <Field label="Intro" value={content.featuresIntro} onChange={(v) => patch({ featuresIntro: v })} rows={3} />
        <ItemList
          kind="Feature"
          items={content.features}
          onChange={(features) => patch({ features })}
          blank={{ title: "New feature", body: "" }}
          titleKey="title"
          bodyKey="body"
        />
      </>
    );
  }
  return (
    <>
      <Field label="Eyebrow" value={content.servicesEyebrow} onChange={(v) => patch({ servicesEyebrow: v })} />
      <Field label="Section title" value={content.servicesTitle} onChange={(v) => patch({ servicesTitle: v })} rows={2} />
      <p className="text-sm text-[var(--muted)]">
        Service cards and their detail pages (Domestic, International, Express, Documents) come from the
        service catalogue so each card always matches its page.
      </p>
    </>
  );
}

function ItemList<T extends HomeFeature | HomeService>({
  kind,
  items,
  onChange,
  blank,
  titleKey,
  bodyKey,
}: {
  kind: string;
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  titleKey: keyof T & string;
  bodyKey: keyof T & string;
}) {
  return (
    <>
      <ul className="space-y-6 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-6">
        {items.map((item, index) => (
          <li key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--muted)]">
                {kind} {index + 1}
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-[var(--danger)]"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
            <Field
              label={titleKey === "title" ? "Title" : "Name"}
              value={String(item[titleKey])}
              onChange={(v) =>
                onChange(items.map((row, i) => (i === index ? { ...row, [titleKey]: v } : row)))
              }
            />
            <Field
              label={bodyKey === "body" ? "Body" : "Detail"}
              value={String(item[bodyKey])}
              rows={3}
              onChange={(v) =>
                onChange(items.map((row, i) => (i === index ? { ...row, [bodyKey]: v } : row)))
              }
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="text-sm font-semibold text-[var(--gold)]"
        onClick={() => onChange([...items, blank])}
      >
        + Add {kind.toLowerCase()}
      </button>
    </>
  );
}
