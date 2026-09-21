import Link from "next/link";

export function HomeSections({ bookHref }: { bookHref: string }) {
  return (
    <>
      <section className="home-section relative border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
            How Hulakico moves a shipment
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
            One path from intent to delivery — we rank partners and keep the
            story in a single timeline.
          </p>
          <ol className="mt-10 space-y-8">
            {[
              {
                n: "01",
                title: "Book once",
                body: "Domestic Nepal or international — one draft, one lane choice.",
              },
              {
                n: "02",
                title: "We score carriers",
                body: "Quotes plus AI ranking for price, ETA risk, and COD fit.",
              },
              {
                n: "03",
                title: "Track one AWB",
                body: "Hulakico AWB, partner handoff, exceptions, and replies in one place.",
              },
            ].map((step) => (
              <li key={step.n} className="flex gap-5">
                <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--gold)]">
                  {step.n}
                </span>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-section relative px-6 py-20 sm:px-10">
        <div
          aria-hidden
          className="shell-route pointer-events-none absolute inset-x-[12%] top-1/2 h-px bg-gradient-to-r from-transparent via-[var(--teal)] to-transparent"
        />
        <div className="relative mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
            Kathmandu to the world
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
            Valley express and Terai lanes at home. Cross-border and air
            partners when the destination leaves Nepal — still one booking
            brain.
          </p>
        </div>
      </section>

      <section className="home-section border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
            Built for trust on the road
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
            COD ledger for domestic cash collection. Document QC before
            international books. Ops can request missing info — you reply on
            tracking.
          </p>
          <Link
            href={bookHref}
            className="mt-10 inline-flex rounded-md bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110"
          >
            Start a booking
          </Link>
        </div>
      </section>

      <footer className="border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <p className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--off-white)]">
            Hulakico
          </p>
          <p className="text-xs text-[var(--muted)]">
            One booking brain. Every carrier. Domestic + world.
          </p>
        </div>
      </footer>
    </>
  );
}
