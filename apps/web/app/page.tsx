export default function Home() {
  return (
    <div className="shell-sky relative overflow-hidden">
      <div
        aria-hidden
        className="shell-route pointer-events-none absolute inset-x-0 top-[28%] h-px bg-gradient-to-r from-transparent via-[var(--teal)] to-transparent"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--off-white)]">
          Hulakico
        </p>
        <p className="font-[family-name:var(--font-body)] text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Logistics control tower
        </p>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] max-w-3xl flex-col justify-center px-6 pb-24 sm:px-10">
        <p className="shell-rise font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.05] tracking-tight text-[var(--off-white)] sm:text-7xl">
          Hulakico
        </p>
        <h1 className="shell-rise-delay mt-6 max-w-xl font-[family-name:var(--font-display)] text-xl font-bold leading-snug text-[var(--off-white)] sm:text-2xl">
          One booking brain for Nepal and the world — every carrier, one
          timeline.
        </h1>
        <p className="shell-rise-delay mt-4 max-w-lg font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--muted)]">
          Book domestic and international shipments through Hulakico. We
          orchestrate trusted third-party agents today, ready for our own fleet
          tomorrow.
        </p>
        <div className="shell-rise-delay mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#book"
            className="inline-flex items-center justify-center rounded-md bg-[var(--gold)] px-6 py-3 font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--navy)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal)]"
          >
            Book a shipment
          </a>
          <span className="font-[family-name:var(--font-body)] text-xs text-[var(--muted)]">
            Phase 1 shell — booking arrives in later steps
          </span>
        </div>
      </main>
    </div>
  );
}
