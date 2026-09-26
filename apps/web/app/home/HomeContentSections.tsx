import Link from "next/link";
import type { HomepageContent } from "@/lib/data/homepage-content";
import { SERVICE_PAGES } from "@/lib/data/service-pages";

const cardClass =
  "overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)]";

export function HomeHighlights({ items }: { items: string[] }) {
  const visible = items.filter((item) => item.trim());
  if (visible.length === 0) return null;
  return (
    <section className="px-6 pt-8 sm:px-12">
      <ul className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-2">
        {visible.map((alert, index) => (
          <li key={`${index}-${alert}`} className="flex items-center gap-2 text-sm text-[var(--off-white)]/80">
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--teal)]" />
            {alert}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeServices({ content }: { content: HomepageContent }) {
  return (
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
  );
}

export function HomeFeatures({ content }: { content: HomepageContent }) {
  return (
    <section id="features" className="home-section scroll-mt-6 border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-24 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">{content.featuresEyebrow}</p>
        <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)] sm:text-5xl">{content.featuresTitle}</h2>
        <p className="mt-4 max-w-lg text-base text-[var(--off-white)]/90">{content.featuresIntro}</p>
        <ul className="mt-14 grid gap-8 sm:grid-cols-3">
          {content.features.map((item, index) => (
            <li key={`${index}-${item.title}`} className={cardClass}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="h-40 w-full object-cover" />
              <div className="p-5">
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">{item.title}</p>
                <p className="mt-2 text-sm text-[var(--off-white)]/85">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
