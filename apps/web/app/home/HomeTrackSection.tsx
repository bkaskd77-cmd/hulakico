"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

/** Homepage "Track a shipment" box — resolves an AWB or tracking code to the public track page. */
export function HomeTrackSection({ title, placeholder }: { title: string; placeholder: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onTrack(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/track/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No shipment matched.");
        return;
      }
      router.push(`/track/${data.token}`);
    } catch (err) {
      console.error("[HomeTrackSection.tsx:onTrack]", err);
      setError("Tracking lookup failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="track" className="home-section scroll-mt-6 px-6 sm:px-12">
      <div className="mx-auto max-w-6xl rounded-xl border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5 shadow-xl sm:p-6">
        <form onSubmit={onTrack} className={`flex flex-col gap-3 sm:flex-row sm:items-end ${pending ? "hub-scanning rounded-md" : ""}`}>
          <label className="block flex-1 text-sm font-semibold text-[var(--off-white)]">
            {title}
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder}
              className="mt-2 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-3 font-normal text-[var(--off-white)]" required />
          </label>
          <button type="submit" disabled={pending} className="rounded-md bg-[var(--gold)] px-8 py-3 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
            {pending ? "Scanning…" : "Track"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      </div>
    </section>
  );
}
