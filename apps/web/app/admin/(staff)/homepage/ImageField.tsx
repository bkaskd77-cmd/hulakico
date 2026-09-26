"use client";

import { ChangeEvent, useState } from "react";
import { LABEL } from "@/app/admin/(staff)/homepage/AdminFields";

/** Image picker: preview, upload to Vercel Blob, or reset to the built-in photo. */
export function ImageField({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value: string;
  defaultValue: string;
  onChange: (url: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      onChange(data.url);
    } catch (err) {
      console.error("[ImageField.tsx:onFile]", err);
      setError("Upload failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <span className={LABEL}>{label}</span>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value || defaultValue} alt="" className="h-20 w-32 rounded-md border border-[color-mix(in_srgb,var(--off-white)_18%,transparent)] object-cover" />
        <div className="flex flex-col items-start gap-1.5">
          <label className={`cursor-pointer rounded-md border border-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--gold)] transition hover:bg-[color-mix(in_srgb,var(--gold)_18%,transparent)] ${pending ? "pointer-events-none opacity-60" : ""}`}>
            {pending ? "Uploading…" : "Upload new image"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={onFile} disabled={pending} />
          </label>
          {value !== defaultValue ? (
            <button type="button" className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--off-white)]" onClick={() => onChange(defaultValue)}>
              Reset to original photo
            </button>
          ) : null}
          <p className="text-[11px] text-[var(--muted)]">JPG, PNG, WebP or AVIF · up to 4 MB</p>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
