import Link from "next/link";
import { HomeQuoteForm } from "@/app/home/HomeQuoteForm";
import type { HomepageContent } from "@/lib/data/homepage-content";

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
    <>
      <section className="home-hero relative min-h-dvh overflow-hidden">
        <div aria-hidden className="home-hero-aurora pointer-events-none absolute inset-0" />
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="hk-lane" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--teal)" stopOpacity="0" />
              <stop offset="45%" stopColor="var(--teal)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path
            className="home-lane"
            d="M80 620 C 280 480, 420 720, 640 540 S 980 380, 1360 260"
            fill="none"
            stroke="url(#hk-lane)"
            strokeWidth="1.6"
          />
          <path
            className="home-lane home-lane-slow"
            d="M40 740 C 260 640, 520 800, 760 620 S 1100 420, 1400 480"
            fill="none"
            stroke="color-mix(in srgb, var(--teal) 55%, transparent)"
            strokeWidth="1"
          />
          <circle className="home-node" style={{ transformOrigin: "640px 540px" }} cx="640" cy="540" r="4" fill="var(--gold)" />
          <circle className="home-node home-node-delay" style={{ transformOrigin: "980px 380px" }} cx="980" cy="380" r="3.5" fill="var(--teal)" />
          <circle className="home-node" style={{ transformOrigin: "1360px 260px" }} cx="1360" cy="260" r="4.5" fill="var(--off-white)" />
        </svg>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[color-mix(in_srgb,var(--navy)_88%,#1a6b7a)] to-transparent"
        />

        <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-12">
          <p className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-[var(--off-white)]">
            Hulakico
          </p>
          <nav className="flex items-center gap-4 text-sm sm:gap-5">
            <a href="#features" className="text-[var(--off-white)]/90 hover:text-[var(--off-white)]">
              How it works
            </a>
            <a href="#services" className="hidden text-[var(--off-white)]/90 hover:text-[var(--off-white)] sm:inline">
              Services
            </a>
            <button type="button" data-open-quote className="hidden text-[var(--off-white)]/90 hover:text-[var(--off-white)] sm:inline">
              {content.ctaQuote}
            </button>
            {signedIn ? (
              <Link href="/account" className="rounded-md bg-[var(--teal)] px-3.5 py-1.5 font-medium text-[var(--off-white)]">
                Account
              </Link>
            ) : (
              <>
                <Link href="/signin" className="text-[var(--off-white)]/90 hover:text-[var(--off-white)]">
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-md bg-[var(--teal)] px-3.5 py-1.5 font-medium text-[var(--off-white)]">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] max-w-5xl flex-col justify-center px-6 pb-24 sm:px-12">
          <p className="shell-rise font-[family-name:var(--font-display)] text-[clamp(3.4rem,12vw,7.5rem)] font-extrabold leading-[0.92] tracking-[-0.04em] text-[var(--off-white)]">
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
      <HomeQuoteForm bookHref={bookHref} />
    </>
  );
}
