"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageContent } from "@/lib/data/homepage-content";
import { SERVICE_PAGES } from "@/lib/data/service-pages";

const FEATURE_IMAGES = ["/home/feature-1.jpg", "/home/feature-2.jpg", "/home/feature-3.jpg"];

const cardClass =
  "overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)]";

/** Homepage body: track strip, alerts, service cards, platform features. */
export function HomeSections({ content }: { content: HomepageContent }) {
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
      console.error("[HomeSections.tsx:onTrack]", err);
      setError("Tracking lookup failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section id="track" className="home-section scroll-mt-6 px-6 sm:px-12">
        <div className="mx-auto max-w-6xl rounded-xl border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5 shadow-xl sm:p-6">
          <form onSubmit={onTrack} className={`flex flex-col gap-3 sm:flex-row sm:items-end ${pending ? "hub-scanning rounded-md" : ""}`}>
            <label className="block flex-1 text-sm font-semibold text-[var(--off-white)]">
              Track a shipment
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={content.hubTrackPlaceholder}
                className="mt-2 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-3 font-normal text-[var(--off-white)]" required />
            </label>
            <button type="submit" disabled={pending} className="rounded-md bg-[var(--gold)] px-8 py-3 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
              {pending ? "Scanning…" : "Track"}
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        </div>
      </section>

      {content.towerAlerts.length > 0 ? (
        <section className="px-6 pt-8 sm:px-12">
          <ul className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-2">
            {content.towerAlerts.map((alert) => (
              <li key={alert} className="flex items-center gap-2 text-sm text-[var(--off-white)]/80">
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--teal)]" />
                {alert}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="services" className="home-section scroll-mt-6 px-6 py-24 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">{content.servicesEyebrow}</p>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)] sm:text-5xl">
            {content.servicesTitle}
          </h2>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_PAGES.map((service, i) => (
              <li key={service.slug} className="hub-rank-item" style={{ animationDelay: `${i * 90}ms` }}>
                <Link href={`/services/${service.slug}`} className={`group flex h-full flex-col ${cardClass} transition hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--gold)_55%,transparent)]`}>
                  <div className="relative h-44 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={service.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    {service.tag ? (
                      <span className="absolute right-3 top-3 rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--navy)]">
                        {service.tag}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">{service.title}</p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--off-white)]/80">{service.summary}</p>
                    <p className="mt-4 text-sm font-semibold text-[var(--gold)]">Learn more →</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className="home-section scroll-mt-6 border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-24 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">{content.featuresEyebrow}</p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)] sm:text-5xl">{content.featuresTitle}</h2>
          <p className="mt-4 max-w-lg text-base text-[var(--off-white)]/90">{content.featuresIntro}</p>
          <ul className="mt-14 grid gap-8 sm:grid-cols-3">
            {content.features.map((item, i) => (
              <li key={item.title} className={cardClass}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FEATURE_IMAGES[i % FEATURE_IMAGES.length]} alt="" className="h-40 w-full object-cover" />
                <div className="p-5">
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">{item.title}</p>
                  <p className="mt-2 text-sm text-[var(--off-white)]/85">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
