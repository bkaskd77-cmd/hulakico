import Link from "next/link";
import type { HomepageContent } from "@/lib/data/homepage-content";

/** Brand-first hero — no side hub; Track lives in nav. */
export function HomeHero({
  bookHref,
  signedIn,
  content,
}: {
  bookHref: string;
  signedIn: boolean;
  content: HomepageContent;
}) {
  return (
    <section className="home-hero relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[color-mix(in_srgb,var(--navy)_92%,transparent)] via-[color-mix(in_srgb,var(--navy)_78%,transparent)] to-[color-mix(in_srgb,var(--navy)_55%,transparent)]"
      />
      <div aria-hidden className="home-hero-aurora pointer-events-none absolute inset-0 opacity-60" />

      <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-5 sm:px-12">
        <p className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-[var(--off-white)]">
          Hulakico
        </p>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm sm:gap-5">
          <a href="#track" className="font-semibold text-[var(--gold)] hover:brightness-110">
            Track a shipment
          </a>
          <Link href={bookHref} className="hidden text-[var(--off-white)]/90 hover:text-[var(--off-white)] sm:inline">
            {content.hubBookLabel}
          </Link>
          <button type="button" data-open-quote className="hidden text-[var(--off-white)]/90 hover:text-[var(--off-white)] sm:inline">
            {content.hubQuoteLabel}
          </button>
          <a href="#features" className="hidden text-[var(--off-white)]/90 hover:text-[var(--off-white)] md:inline">
            How it works
          </a>
          {signedIn ? (
            <Link href="/account" className="rounded-md bg-[var(--teal)] px-3.5 py-1.5 font-medium text-[var(--off-white)]">
              Account
            </Link>
          ) : (
            <Link href="/signin" className="rounded-md bg-[var(--teal)] px-3.5 py-1.5 font-medium text-[var(--off-white)]">
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] max-w-5xl flex-col justify-center px-6 pb-24 sm:px-12">
        <p className="shell-rise font-[family-name:var(--font-display)] text-[clamp(3.4rem,12vw,7rem)] font-extrabold leading-[0.92] tracking-[-0.04em] text-[var(--off-white)]">
          Hulakico
        </p>
        <h1 className="shell-rise-delay mt-6 max-w-2xl font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--off-white)] sm:text-3xl">
          {content.heroHeadline}
        </h1>
        <p className="shell-rise-delay mt-4 max-w-md text-base leading-relaxed text-[var(--off-white)]/90">
          {content.heroSubhead}
        </p>
        <div className="shell-rise-delay mt-10 flex flex-wrap items-center gap-4">
          <Link
            href={bookHref}
            className="inline-flex rounded-md bg-[var(--gold)] px-7 py-3.5 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110"
          >
            {content.ctaBook}
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
  );
}
