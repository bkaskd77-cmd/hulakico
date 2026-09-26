"use client";

import { Field } from "@/app/admin/(staff)/homepage/AdminFields";
import { EditableList } from "@/app/admin/(staff)/homepage/EditableList";
import { ImageField } from "@/app/admin/(staff)/homepage/ImageField";
import { SERVICE_LIMITS, type ServiceItem } from "@/lib/domain/service-catalogue";

/** Edit one service: card copy, photo, and detail-page lists. */
export function ServiceEditForm({
  item,
  onChange,
  onBack,
  onRemove,
  canRemove,
}: {
  item: ServiceItem;
  onChange: (item: ServiceItem) => void;
  onBack: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="mt-8 max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline"
        >
          ← All services
        </button>
        <button
          type="button"
          disabled={!canRemove}
          onClick={onRemove}
          className="text-sm font-semibold text-[var(--danger)] disabled:opacity-30"
        >
          Remove this service
        </button>
      </div>
      <Field label="Title" value={item.title} onChange={(title) => onChange({ ...item, title })} />
      <Field
        label="URL slug"
        value={item.slug}
        placeholder="domestic"
        onChange={(slug) => onChange({ ...item, slug })}
      />
      <Field
        label="Tag (optional)"
        value={item.tag}
        placeholder="Popular"
        onChange={(tag) => onChange({ ...item, tag })}
      />
      <ImageField
        label="Photo"
        frame="card"
        value={item.image}
        defaultValue={item.image}
        onChange={(image) => onChange({ ...item, image })}
      />
      <Field
        label="Card summary"
        value={item.summary}
        rows={2}
        onChange={(summary) => onChange({ ...item, summary })}
      />
      <Field
        label="Page intro"
        value={item.intro}
        rows={3}
        onChange={(intro) => onChange({ ...item, intro })}
      />
      <EditableList
        itemLabel="Highlight"
        items={item.highlights}
        max={SERVICE_LIMITS.highlights}
        blank={() => ""}
        onChange={(highlights) => onChange({ ...item, highlights })}
        renderItem={(line, setLine) => <Field label="Text" value={line} onChange={setLine} />}
      />
      <EditableList
        itemLabel="Need"
        items={item.needs}
        max={SERVICE_LIMITS.needs}
        blank={() => ""}
        onChange={(needs) => onChange({ ...item, needs })}
        renderItem={(line, setLine) => <Field label="Text" value={line} onChange={setLine} />}
      />
      <EditableList
        itemLabel="Step"
        items={item.howItWorks}
        max={SERVICE_LIMITS.howItWorks}
        blank={() => ""}
        onChange={(howItWorks) => onChange({ ...item, howItWorks })}
        renderItem={(line, setLine) => <Field label="Text" value={line} onChange={setLine} />}
      />
    </div>
  );
}
