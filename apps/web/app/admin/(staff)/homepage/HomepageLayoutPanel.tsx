"use client";

import { SectionNote, Toggle } from "@/app/admin/(staff)/homepage/AdminFields";
import { HOME_SECTION_LABELS, type HomepageContent, type HomeSectionKey } from "@/lib/domain/homepage-types";

const ICON_BUTTON =
  "rounded border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--off-white)] transition hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:pointer-events-none disabled:opacity-30";

/** Section order and visibility between the hero (always first) and the footer (always last). */
export function HomepageLayoutPanel({
  content,
  patch,
}: {
  content: HomepageContent;
  patch: (partial: Partial<HomepageContent>) => void;
}) {
  const order = content.sectionOrder;

  function move(index: number, to: number) {
    const next = [...order];
    const [key] = next.splice(index, 1);
    next.splice(to, 0, key);
    patch({ sectionOrder: next });
  }

  function setVisible(key: HomeSectionKey, visible: boolean) {
    const hidden = content.hiddenSections.filter((item) => item !== key);
    patch({ hiddenSections: visible ? hidden : [...hidden, key] });
  }

  return (
    <>
      <SectionNote>
        Arrange the homepage between the hero and the footer. Hidden sections keep their content and can be shown again any time.
      </SectionNote>
      <ol className="space-y-3">
        <li className="rounded-lg border border-dashed border-[color-mix(in_srgb,var(--off-white)_18%,transparent)] px-4 py-3 text-sm text-[var(--muted)]">
          Hero (always first)
        </li>
        {order.map((key, index) => {
          const visible = !content.hiddenSections.includes(key);
          return (
            <li key={key} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[color-mix(in_srgb,var(--navy)_40%,transparent)] px-4 py-3 ${visible ? "" : "opacity-60"}`}>
              <span className="text-sm font-semibold text-[var(--off-white)]">
                {index + 1}. {HOME_SECTION_LABELS[key]}
              </span>
              <div className="flex items-center gap-2">
                <Toggle label={visible ? "Shown" : "Hidden"} checked={visible} onChange={(v) => setVisible(key, v)} />
                <button type="button" aria-label={`Move ${HOME_SECTION_LABELS[key]} up`} className={ICON_BUTTON} disabled={index === 0} onClick={() => move(index, index - 1)}>↑</button>
                <button type="button" aria-label={`Move ${HOME_SECTION_LABELS[key]} down`} className={ICON_BUTTON} disabled={index === order.length - 1} onClick={() => move(index, index + 1)}>↓</button>
              </div>
            </li>
          );
        })}
        <li className="rounded-lg border border-dashed border-[color-mix(in_srgb,var(--off-white)_18%,transparent)] px-4 py-3 text-sm text-[var(--muted)]">
          Footer (always last)
        </li>
      </ol>
    </>
  );
}
