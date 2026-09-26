"use client";

export const FIELD =
  "mt-1.5 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[color-mix(in_srgb,var(--navy)_70%,transparent)] px-3 py-2.5 text-sm text-[var(--off-white)] outline-none transition focus:border-[var(--gold)]";
export const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]";

export function Field({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {rows ? (
        <textarea className={`${FIELD} min-h-[5.5rem] resize-y`} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={FIELD} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-sm font-semibold text-[var(--off-white)]"
    >
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-[var(--gold)]" : "bg-[color-mix(in_srgb,var(--off-white)_22%,transparent)]"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[var(--navy)] transition-all ${checked ? "left-[1.125rem]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function SectionNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--muted)]">{children}</p>;
}
