import Link from "next/link";
import type { HomepageContent } from "@/lib/data/homepage-content";

export function HomeSections({
  bookHref,
  content,
}: {
  bookHref: string;
  content: HomepageContent;
}) {
  return (
    <>
      <section id="features" className="home-section relative px-6 py-24 sm:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
            {content.featuresEyebrow}
          </p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-5xl">
            {content.featuresTitle}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--off-white)]/90">
            {content.featuresIntro}
          </p>
          <ul className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {content.features.map((item) => (
              <li
                key={item.title}
                className="border-t border-[color-mix(in_srgb,var(--teal)_45%,transparent)] pt-5"
              >
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--off-white)]/85">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="services"
        className="home-section relative border-y border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-24 sm:px-12"
      >
        <div aria-hidden className="home-services-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">
            {content.servicesEyebrow}
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-5xl">
            {content.servicesTitle}
          </h2>
          <ul className="mt-12 divide-y divide-[color-mix(in_srgb,var(--off-white)_12%,transparent)]">
            {content.services.map((svc) => (
              <li
                key={svc.name}
                className="flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-10"
              >
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
                  {svc.name}
                </p>
                <p className="max-w-md text-sm leading-relaxed text-[var(--off-white)]/85 sm:text-right">
                  {svc.detail}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              href={bookHref}
              className="inline-flex rounded-md bg-[var(--gold)] px-7 py-3.5 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110"
            >
              {content.servicesCta}
            </Link>
            <button
              type="button"
              data-open-quote
              className="inline-flex rounded-md border border-[var(--off-white)] px-7 py-3.5 text-sm font-semibold text-[var(--off-white)] transition hover:bg-[color-mix(in_srgb,var(--off-white)_14%,transparent)]"
            >
              {content.ctaQuote}
            </button>
          </div>
        </div>
      </section>

      <footer className="home-footer relative overflow-hidden px-6 pb-12 pt-20 sm:px-12">
        <div aria-hidden className="home-footer-beam pointer-events-none absolute inset-x-0 top-0 h-px" />
        <div className="relative mx-auto grid max-w-5xl gap-12 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-5xl">
              Hulakico
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--off-white)]/90">
              {content.footerTagline}
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm sm:items-end sm:text-right">
            <Link href={bookHref} className="font-medium text-[var(--gold)] hover:brightness-110">
              {content.ctaBook}
            </Link>
            <Link href="/signin" className="text-[var(--off-white)] hover:text-[var(--gold)]">
              Customer sign in
            </Link>
            <a href="#features" className="text-[var(--off-white)] hover:text-[var(--gold)]">
              Platform
            </a>
            <p className="mt-6 text-xs text-[var(--off-white)]/80">
              © {new Date().getFullYear()} Hulakico · Kathmandu
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
