"use client";

const ICON_BUTTON =
  "rounded border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-2 py-0.5 text-xs font-semibold text-[var(--off-white)] transition hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:pointer-events-none disabled:opacity-30";

function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Add / remove / reorder any list in the homepage editor. */
export function EditableList<T>({
  itemLabel,
  items,
  onChange,
  blank,
  max,
  renderItem,
}: {
  itemLabel: string;
  items: T[];
  onChange: (items: T[]) => void;
  blank: () => T;
  max: number;
  renderItem: (item: T, update: (next: T) => void, index: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li
            key={index}
            className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[color-mix(in_srgb,var(--navy)_40%,transparent)] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[var(--muted)]">
                {itemLabel} {index + 1}
              </p>
              <div className="flex items-center gap-1.5">
                <button type="button" aria-label={`Move ${itemLabel} ${index + 1} up`} className={ICON_BUTTON}
                  disabled={index === 0} onClick={() => onChange(move(items, index, index - 1))}>
                  ↑
                </button>
                <button type="button" aria-label={`Move ${itemLabel} ${index + 1} down`} className={ICON_BUTTON}
                  disabled={index === items.length - 1} onClick={() => onChange(move(items, index, index + 1))}>
                  ↓
                </button>
                <button type="button" className="ml-1 text-xs font-semibold text-[var(--danger)]"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}>
                  Remove
                </button>
              </div>
            </div>
            {renderItem(item, (next) => onChange(items.map((row, i) => (i === index ? next : row))), index)}
          </li>
        ))}
      </ul>
      {items.length === 0 ? <p className="text-sm text-[var(--muted)]">Nothing here yet.</p> : null}
      <button
        type="button"
        disabled={items.length >= max}
        className="text-sm font-semibold text-[var(--gold)] disabled:opacity-40"
        onClick={() => onChange([...items, blank()])}
      >
        + Add {itemLabel.toLowerCase()}
        {items.length >= max ? ` (limit ${max})` : ""}
      </button>
    </div>
  );
}
