import Link from "next/link";

const FEATURES = [
  {
    title: "One booking brain",
    body: "Domestic Nepal or international — a single draft becomes ranked carrier options and a confirmed AWB.",
  },
  {
    title: "AI lane intelligence",
    body: "ETA risk, document QC, and carrier scoring run behind the book so ops and customers share one truth.",
  },
  {
    title: "Live exception loop",
    body: "Holds, missing docs, and COD settle stay on the same timeline — reply from track, resolve from the tower.",
  },
];

const SERVICES = [
  { name: "Nepal domestic", detail: "Valley, Terai, and hill lanes with COD when cash must travel with the parcel." },
  { name: "International", detail: "Cross-border and air partners with commercial invoice tooling and QC gates." },
  { name: "Live tracking", detail: "One public link for shipper and consignee — status updates in one place." },
  { name: "Settle & notify", detail: "Payments, COD ledger, and booking confirmations without leaving the tower." },
];

export function HomeSections({ bookHref }: { bookHref: string }) {
  return (
    <>
      <section id="features" className="home-section relative px-6 py-24 sm:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">Platform</p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-5xl">
            Built like a control tower, not a form.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--off-white)]/90">
            Hulakico is the middleman layer — AI ranks partners, humans stay in the loop, customers see one story.
          </p>
          <ul className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {FEATURES.map((item) => (
              <li key={item.title} className="border-t border-[color-mix(in_srgb,var(--teal)_45%,transparent)] pt-5">
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--off-white)]/85">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="services" className="home-section relative border-y border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-24 sm:px-12">
        <div aria-hidden className="home-services-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">Services</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-5xl">
            What we run for every shipment.
          </h2>
          <ul className="mt-12 divide-y divide-[color-mix(in_srgb,var(--off-white)_12%,transparent)]">
            {SERVICES.map((svc) => (
              <li key={svc.name} className="flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-10">
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
                  {svc.name}
                </p>
                <p className="max-w-md text-sm leading-relaxed text-[var(--off-white)]/85 sm:text-right">{svc.detail}</p>
              </li>
            ))}
          </ul>
          <Link
            href={bookHref}
            className="mt-12 inline-flex rounded-md bg-[var(--gold)] px-7 py-3.5 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110"
          >
            Start a booking
          </Link>
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
              One booking brain. Every carrier. Domestic + world — Nepal&apos;s AI-powered logistics middleman.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm sm:items-end sm:text-right">
            <Link href={bookHref} className="font-medium text-[var(--gold)] hover:brightness-110">
              Book a shipment
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
