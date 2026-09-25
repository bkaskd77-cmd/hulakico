"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageContent } from "@/lib/data/homepage-content";
import { INFO_GROUPS, INFO_PAGES } from "@/lib/data/info-pages";

const FEATURE_IMAGES = [
  "/home/feature-1.jpg",
  "/home/feature-2.jpg",
  "/home/feature-3.jpg",
];

export function HomeSections({
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
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)] sm:text-5xl">{content.featuresTitle}</h2>
          <p className="mt-4 max-w-lg text-base text-[var(--off-white)]/90">{content.featuresIntro}</p>
          <ul className="mt-14 grid gap-8 sm:grid-cols-3">
            {content.features.map((item, i) => (
              <li key={item.title} className="overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)]">
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

      <section id="services" className="home-section relative border-y border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-24 sm:px-12">
        <div className="relative mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-stretch">
          <div className="relative min-h-64 overflow-hidden rounded-lg lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/services.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">{content.servicesEyebrow}</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)]">{content.servicesTitle}</h2>
            <ul className="mt-8 flex-1 divide-y divide-[color-mix(in_srgb,var(--off-white)_12%,transparent)]">
              {content.services.map((svc) => (
                <li key={svc.name} className="py-4">
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">{svc.name}</p>
                  <p className="mt-1 text-sm text-[var(--off-white)]/85">{svc.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="home-footer relative overflow-hidden border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)]">
        <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: "url(/home/footer.jpg)" }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-[color-mix(in_srgb,var(--navy)_88%,transparent)] to-[color-mix(in_srgb,var(--navy)_70%,transparent)]" />
        <div aria-hidden className="home-footer-beam pointer-events-none absolute inset-x-0 top-0 h-px" />
        <div className="relative mx-auto grid max-w-5xl gap-10 px-6 pb-10 pt-16 sm:grid-cols-[1.6fr_1fr_1fr_1fr] sm:px-12">
          <div>
            <p className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)]">Hulakico</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--off-white)]/90">{content.footerTagline}</p>
          </div>
          {INFO_GROUPS.map((group) => (
            <div key={group} className="flex flex-col gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">{group}</p>
              {INFO_PAGES.filter((page) => page.group === group).map((page) => (
                <Link key={page.slug} href={`/${page.slug}`} className="text-[var(--off-white)]/85 hover:text-[var(--gold)]">
                  {page.title}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="relative border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-5 sm:px-12">
          <p className="mx-auto max-w-5xl text-xs text-[var(--off-white)]/70">
            © {new Date().getFullYear()} Hulakico · Kathmandu, Nepal
          </p>
        </div>
      </footer>
    </>
  );
}
