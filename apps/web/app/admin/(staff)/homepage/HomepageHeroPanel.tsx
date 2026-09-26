"use client";

import { Field, Toggle } from "@/app/admin/(staff)/homepage/AdminFields";
import { EditableList } from "@/app/admin/(staff)/homepage/EditableList";
import { ImageField } from "@/app/admin/(staff)/homepage/ImageField";
import { DEFAULT_HERO_IMAGE } from "@/lib/domain/homepage-defaults";
import { HOME_LIMITS, type HomepageContent } from "@/lib/domain/homepage-types";

/** Hero tab: headline copy, buttons, photo, live-timeline card, and the track box wording. */
export function HomepageHeroPanel({
  content,
  patch,
}: {
  content: HomepageContent;
  patch: (partial: Partial<HomepageContent>) => void;
}) {
  return (
    <>
      <Field label="Badge above headline" value={content.heroBadge} onChange={(v) => patch({ heroBadge: v })} />
      <Field label="Headline" value={content.heroHeadline} onChange={(v) => patch({ heroHeadline: v })} rows={2} />
      <Field label="Gold words in headline (must match exactly)" value={content.heroAccent} onChange={(v) => patch({ heroAccent: v })} />
      <Field label="Supporting line" value={content.heroSubhead} onChange={(v) => patch({ heroSubhead: v })} rows={3} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Book button" value={content.ctaBook} onChange={(v) => patch({ ctaBook: v })} />
        <Field label="Quote button" value={content.ctaQuote} onChange={(v) => patch({ ctaQuote: v })} />
      </div>

      <ImageField label="Hero photo" value={content.heroImage} defaultValue={DEFAULT_HERO_IMAGE} onChange={(url) => patch({ heroImage: url })} />
      <Field label="Photo description (for screen readers)" value={content.heroImageAlt} onChange={(v) => patch({ heroImageAlt: v })} />

      <div className="space-y-4 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-5">
        <Toggle label="Show the live-timeline card on the photo" checked={content.showHeroTimeline} onChange={(v) => patch({ showHeroTimeline: v })} />
        {content.showHeroTimeline ? (
          <>
            <Field label="Card title" value={content.heroTimelineTitle} onChange={(v) => patch({ heroTimelineTitle: v })} />
            <EditableList
              itemLabel="Step"
              items={content.heroTimeline}
              max={HOME_LIMITS.heroTimeline}
              blank={() => ({ label: "", done: false })}
              onChange={(heroTimeline) => patch({ heroTimeline })}
              renderItem={(step, update) => (
                <div className="space-y-3">
                  <Field label="Step name" value={step.label} onChange={(label) => update({ ...step, label })} />
                  <Toggle label="Completed (gold dot)" checked={step.done} onChange={(done) => update({ ...step, done })} />
                </div>
              )}
            />
          </>
        ) : null}
      </div>

      <div className="grid gap-5 border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-5 sm:grid-cols-2">
        <Field label="Track box title" value={content.trackTitle} onChange={(v) => patch({ trackTitle: v })} />
        <Field label="Track box hint" value={content.hubTrackPlaceholder} onChange={(v) => patch({ hubTrackPlaceholder: v })} />
      </div>
    </>
  );
}
