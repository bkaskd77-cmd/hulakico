"use client";

import { useEffect, useRef, useState } from "react";
import type { InvoiceUpload as Upload } from "@/lib/data/invoice-uploads";

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Optional: attach the customer's own invoice (PDF or photo) alongside the Hulakico invoice. */
export function InvoiceUpload({ shipmentId }: { shipmentId: string }) {
  const [upload, setUpload] = useState<Upload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const url = `/api/bookings/${shipmentId}/invoice/upload`;

  useEffect(() => {
    fetch(`${url}?info=1`)
      .then((res) => (res.ok ? res.json() : { upload: null }))
      .then((data: { upload: Upload | null }) => setUpload(data.upload))
      .catch((err) => console.error("[InvoiceUpload.tsx:load]", err instanceof Error ? err.message : err));
  }, [url]);

  async function send(file: File) {
    setError(null);
    if (file.size > 3 * 1024 * 1024) return setError("The file is larger than 3 MB. Save a smaller PDF or photo.");
    setPending(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(url, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "Could not upload the file.");
      setUpload(data.upload as Upload);
    } catch (err) {
      console.error("[InvoiceUpload.tsx:send]", err instanceof Error ? err.message : err);
      setError("Could not upload the file. Please try again.");
    } finally {
      setPending(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setError(null);
    try {
      const response = await fetch(url, { method: "DELETE" });
      if (response.ok) setUpload(null);
      else setError("Could not remove the file.");
    } catch (err) {
      console.error("[InvoiceUpload.tsx:remove]", err instanceof Error ? err.message : err);
      setError("Could not remove the file.");
    }
  }

  return (
    <div className="rounded-md border border-dashed border-[color-mix(in_srgb,var(--off-white)_28%,transparent)] p-3">
      <p className="text-sm font-semibold text-[var(--off-white)]">Your own invoice <span className="font-normal text-[var(--muted)]">(optional)</span></p>
      <p className="mt-0.5 text-xs text-[var(--muted)]">Already have a commercial invoice for these goods? Attach it as a PDF or photo (up to 3 MB). It travels with the Hulakico invoice above; please still list the items.</p>
      {upload ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <a href={url} target="_blank" rel="noopener" className="font-semibold text-[var(--teal)] underline">{upload.fileName}</a>
          <span className="text-[var(--muted)]">{kb(upload.bytes)}</span>
          <button type="button" onClick={() => input.current?.click()} disabled={pending} className="font-semibold text-[var(--off-white)] underline">Replace</button>
          <button type="button" onClick={remove} className="font-semibold text-[var(--danger)] underline">Remove</button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} disabled={pending}
          className="mt-2 rounded-md border border-[var(--teal)] px-3 py-1.5 text-xs font-semibold text-[var(--teal)] disabled:opacity-60">
          {pending ? "Uploading…" : "Attach PDF or photo"}
        </button>
      )}
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) void send(file); }} />
      {error ? <p role="alert" className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
