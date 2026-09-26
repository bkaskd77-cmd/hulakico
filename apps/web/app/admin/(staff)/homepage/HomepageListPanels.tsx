"use client";

import Link from "next/link";
import { Field, SectionNote } from "@/app/admin/(staff)/homepage/AdminFields";
import { EditableList } from "@/app/admin/(staff)/homepage/EditableList";
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
        Service cards, photos, and detail pages are edited on the Services page so each card stays in one place.
      </SectionNote>
      <Link href="/admin/services" className="inline-flex text-sm font-semibold text-[var(--gold)] underline-offset-2 hover:underline">
        Open Services →
      </Link>
    </>
  );
}
