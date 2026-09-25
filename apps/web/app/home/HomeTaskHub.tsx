"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeQuoteInline } from "@/app/home/HomeQuoteInline";

export type HubTab = "track" | "book" | "quote";

type Props = {
  bookHref: string;
  labels: {
    track: string;
    book: string;
    quote: string;
    trackPlaceholder: string;
    ctaBook: string;
  };
};

/** Carrier-style task hub: Track · Book · Quote. */
export function HomeTaskHub({ bookHref, labels }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<HubTab>("track");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segment, setSegment] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");

  useEffect(() => {
    function openQuote() {
      setTab("quote");
      document.getElementById("tower-hub")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function openTab(id: HubTab) {
      setTab(id);
      setError(null);
      document.getElementById("tower-hub")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function onClick(event: MouseEvent) {
      const el = event.target as HTMLElement | null;
      if (el?.closest?.("[data-open-quote]")) {
        event.preventDefault();
        openQuote();
        return;
      }
      const hub = el?.closest?.("[data-open-hub]") as HTMLElement | null;
      const id = hub?.getAttribute("data-open-hub") as HubTab | null;
      if (id === "track" || id === "book" || id === "quote") {
        event.preventDefault();
        openTab(id);
      }
    }
    document.addEventListener("click", onClick);
    if (window.location.hash === "#quote") {
      openQuote();
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    return () => document.removeEventListener("click", onClick);
  }, []);

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
      console.error("[HomeTaskHub.tsx:onTrack]", err);
      setError("Tracking lookup failed.");
    } finally {
      setPending(false);
    }
  }

  const tabs: Array<{ id: HubTab; label: string }> = [
    { id: "track", label: labels.track },
    { id: "book", label: labels.book },
    { id: "quote", label: labels.quote },
  ];
  const signupHref = `/signup?type=${segment === "BUSINESS" ? "business" : "individual"}`;

  return (
    <div id="tower-hub" className="hub-shell w-full max-w-lg">
      <div className="flex rounded-t-lg border border-b-0 border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)]/80 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setError(null); }}
            className={`flex-1 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
              tab === t.id ? "bg-[var(--teal)] text-[var(--off-white)]" : "text-[var(--muted)] hover:text-[var(--off-white)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="hub-panel rounded-b-lg border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy-elevated)] p-5 sm:p-6">
        {tab === "track" ? (
          <form onSubmit={onTrack} className={pending ? "hub-scanning" : undefined}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">Live timeline</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={labels.trackPlaceholder}
              className="mt-3 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-3 text-[var(--off-white)]"
              required
            />
            {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
            <button type="submit" disabled={pending} className="mt-4 w-full rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
              {pending ? "Scanning lanes…" : "Track"}
            </button>
          </form>
        ) : null}
        {tab === "book" ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">Start a shipment</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Draft → AI-ranked carriers → one Hulakico AWB.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["INDIVIDUAL", "BUSINESS"] as const).map((value) => (
                <button key={value} type="button" onClick={() => setSegment(value)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${segment === value ? "bg-[var(--teal)] text-[var(--off-white)]" : "bg-[var(--navy)] text-[var(--muted)]"}`}>
                  {value === "INDIVIDUAL" ? "Individual" : "Business"}
                </button>
              ))}
            </div>
            <Link href={bookHref.startsWith("/book") ? bookHref : signupHref}
              className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--navy)]">
              {labels.ctaBook}
            </Link>
          </div>
        ) : null}
        {tab === "quote" ? <HomeQuoteInline bookHref={bookHref} /> : null}
      </div>
    </div>
  );
}
