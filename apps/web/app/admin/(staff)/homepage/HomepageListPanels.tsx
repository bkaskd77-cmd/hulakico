"use client";

import { Field, SectionNote } from "@/app/admin/(staff)/homepage/AdminFields";
import { EditableList } from "@/app/admin/(staff)/homepage/EditableList";
import { ImageField } from "@/app/admin/(staff)/homepage/ImageField";
import { DEFAULT_FEATURE_IMAGES } from "@/lib/domain/homepage-defaults";
import { HOME_LIMITS, type HomepageContent } from "@/lib/domain/homepage-types";

type PanelProps = {
  content: HomepageContent;
  patch: (partial: Partial<HomepageContent>) => void;
};

export function HomepageHighlightsPanel({ content, patch }: PanelProps) {
  return (
    <>
      <SectionNote>Short lines shown in a strip under the track box.</SectionNote>
      <EditableList
        itemLabel="Highlight"
        items={content.towerAlerts}
        max={HOME_LIMITS.towerAlerts}
        blank={() => ""}
        onChange={(towerAlerts) => patch({ towerAlerts })}
        renderItem={(line, update) => <Field label="Text" value={line} onChange={update} />}
      />
    </>
  );
}

export function HomepageServicesPanel({ content, patch }: PanelProps) {
  return (
    <>
      <Field label="Eyebrow" value={content.servicesEyebrow} onChange={(v) => patch({ servicesEyebrow: v })} />
      <Field label="Section title" value={content.servicesTitle} onChange={(v) => patch({ servicesTitle: v })} rows={2} />
      <SectionNote>
        The service cards and their detail pages come from the service catalogue, so each card always matches its page.
        Editing the cards themselves arrives with the Services manager.
      </SectionNote>
    </>
  );
}

export function HomepageFeaturesPanel({ content, patch }: PanelProps) {
  return (
    <>
      <Field label="Eyebrow" value={content.featuresEyebrow} onChange={(v) => patch({ featuresEyebrow: v })} />
      <Field label="Section title" value={content.featuresTitle} onChange={(v) => patch({ featuresTitle: v })} rows={2} />
      <Field label="Intro" value={content.featuresIntro} onChange={(v) => patch({ featuresIntro: v })} rows={3} />
      <EditableList
        itemLabel="Feature"
        items={content.features}
        max={HOME_LIMITS.features}
        blank={() => ({
          title: "",
          body: "",
          image: DEFAULT_FEATURE_IMAGES[content.features.length % DEFAULT_FEATURE_IMAGES.length],
        })}
        onChange={(features) => patch({ features })}
        renderItem={(feature, update, index) => (
          <div className="space-y-3">
            <Field label="Title" value={feature.title} onChange={(title) => update({ ...feature, title })} />
            <Field label="Body" value={feature.body} rows={3} onChange={(body) => update({ ...feature, body })} />
            <ImageField
              label="Photo"
              value={feature.image}
              defaultValue={DEFAULT_FEATURE_IMAGES[index % DEFAULT_FEATURE_IMAGES.length]}
              onChange={(image) => update({ ...feature, image })}
            />
          </div>
        )}
      />
    </>
  );
}
