import Link from "next/link";

export function HomeHero({
  bookHref,
  showOps,
}: {
  bookHref: string;
  showOps: boolean;
}) {
  return (
    <section className="relative min-h-dvh overflow-hidden">
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] w-full text-[color-mix(in_srgb,var(--navy)_72%,#061018)]"
        viewBox="0 0 1200 320"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0 320V180L140 95l110 70 160-120 130 95 180-110 150 85 170-75 160 90V320z"
        />
        <path
          className="shell-rise"
          fill="color-mix(in srgb, var(--teal) 20%, transparent)"
          d="M0 320V220l180 20 140-90 200 70 220-100 180 60 280-40V320z"
        />
      </svg>

      <div
        aria-hidden
        className="shell-route pointer-events-none absolute inset-x-[8%] top-[38%] h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent sm:inset-x-[16%]"
      />
      <div
        aria-hidden
        className="home-dot shell-rise-delay pointer-events-none absolute left-[20%] top-[36%] h-2.5 w-2.5 rounded-full bg-[var(--gold)]"
      />
      <div
        aria-hidden
        className="home-dot shell-rise-delay pointer-events-none absolute right-[22%] top-[36%] h-2.5 w-2.5 rounded-full bg-[var(--teal)]"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--off-white)]">
          Hulakico
        </p>
        <nav className="flex items-center gap-4 text-sm">
          {showOps ? (
            <Link
              href="/account"
              className="rounded-md bg-[var(--teal)] px-3 py-1.5 font-medium text-[var(--off-white)]"
            >
              Account
            </Link>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-[var(--muted)] hover:text-[var(--off-white)]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-[var(--teal)] px-3 py-1.5 font-medium text-[var(--off-white)]"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] max-w-3xl flex-col justify-center px-6 pb-28 sm:px-10">
        <p className="shell-rise font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.05] tracking-tight text-[var(--off-white)] sm:text-7xl">
          Hulakico
        </p>
        <h1 className="shell-rise-delay mt-5 max-w-xl font-[family-name:var(--font-display)] text-xl font-bold leading-snug text-[var(--off-white)] sm:text-2xl">
          One booking brain. Every carrier. Domestic + world.
        </h1>
        <p className="shell-rise-delay mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          Nepal&apos;s logistics middleman — book once, we orchestrate partners
          and keep one timeline from Kathmandu to the world.
        </p>
        <div className="shell-rise-delay mt-10 flex flex-wrap items-center gap-4">
          <Link
            href={bookHref}
            className="inline-flex rounded-md bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110"
          >
            Book a shipment
          </Link>
          {showOps ? (
            <Link
              href="/ops"
              className="text-sm text-[var(--teal)] underline-offset-4 hover:underline"
            >
              Ops tower
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
