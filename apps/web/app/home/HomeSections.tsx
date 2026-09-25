"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageContent } from "@/lib/data/homepage-content";

const FEATURE_IMAGES = [
  "https://images.unsplash.com/photo-1566576912321-d44bfc73a0f7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1578574577315-52ac8753d2d6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=900&q=80",
];

const SERVICE_IMAGE =
  "https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=1400&q=80";

export function HomeSections({
  bookHref,
  content,
}: {
  bookHref: string;
  content: HomepageContent;
}) {
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
      <section id="track" className="home-section border-b border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-10 sm:px-12">
        <form onSubmit={onTrack} className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm text-[var(--muted)]">
            Track a shipment
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={content.hubTrackPlaceholder}
              className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy-elevated)] px-3 py-3 text-[var(--off-white)]" required />
          </label>
          <button type="submit" disabled={pending} className="rounded-md bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--navy)] disabled:opacity-60">
            {pending ? "Scanning…" : "Track"}
          </button>
        </form>
        {error ? <p className="mx-auto mt-3 max-w-5xl text-sm text-[var(--danger)]">{error}</p> : null}
      </section>

      {content.towerAlerts.length > 0 ? (
        <section className="border-b border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] bg-[color-mix(in_srgb,var(--teal)_10%,transparent)] px-6 py-5 sm:px-12">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">Tower alerts</p>
            <ul className="mt-3 space-y-2">
              {content.towerAlerts.map((alert) => (
                <li key={alert} className="text-sm text-[var(--off-white)]/90">{alert}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section id="features" className="home-section px-6 py-24 sm:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">{content.featuresEyebrow}</p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)] sm:text-5xl">
            {content.featuresTitle}
          </h2>
          <p className="mt-4 max-w-lg text-base text-[var(--off-white)]/90">{content.featuresIntro}</p>
          <ul className="mt-14 grid gap-8 sm:grid-cols-3">
            {content.features.map((item, i) => (
              <li key={item.title} className="overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)]">
                <div
                  className="h-36 bg-cover bg-center"
                  style={{ backgroundImage: `url(${FEATURE_IMAGES[i % FEATURE_IMAGES.length]})` }}
                />
                <div className="p-5">
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">{item.title}</p>
                  <p className="mt-2 text-sm text-[var(--off-white)]/85">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="services" className="home-section relative border-y border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-24 sm:px-12">
        <div className="relative mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
          <div
            className="min-h-64 rounded-lg bg-cover bg-center lg:min-h-[22rem]"
            style={{ backgroundImage: `url(${SERVICE_IMAGE})` }}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">{content.servicesEyebrow}</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)]">{content.servicesTitle}</h2>
            <ul className="mt-8 divide-y divide-[color-mix(in_srgb,var(--off-white)_12%,transparent)]">
              {content.services.map((svc) => (
                <li key={svc.name} className="py-4">
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">{svc.name}</p>
                  <p className="mt-1 text-sm text-[var(--off-white)]/85">{svc.detail}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={bookHref} className="rounded-md bg-[var(--gold)] px-7 py-3.5 text-sm font-semibold text-[var(--navy)]">{content.servicesCta}</Link>
              <button type="button" data-open-quote className="rounded-md border border-[var(--off-white)] px-7 py-3.5 text-sm font-semibold text-[var(--off-white)]">{content.ctaQuote}</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="home-footer px-6 pb-12 pt-20 sm:px-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)]">Hulakico</p>
            <p className="mt-4 max-w-sm text-sm text-[var(--off-white)]/90">{content.footerTagline}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:items-end">
            <a href="#track" className="text-[var(--gold)] hover:brightness-110">Track a shipment</a>
            <Link href={bookHref} className="text-[var(--off-white)] hover:text-[var(--gold)]">{content.ctaBook}</Link>
            <Link href="/signin" className="text-[var(--off-white)] hover:text-[var(--gold)]">Sign in</Link>
            <p className="mt-4 text-xs text-[var(--off-white)]/80">© {new Date().getFullYear()} Hulakico · Kathmandu</p>
          </div>
        </div>
      </footer>
    </>
  );
}
