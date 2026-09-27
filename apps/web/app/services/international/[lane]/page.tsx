import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteLink } from "@/app/home/QuoteLink";
import { PublicHeader } from "@/app/home/PublicHeader";
import { SiteFooter } from "@/app/home/SiteFooter";
import { WhatsAppButton } from "@/app/home/WhatsAppButton";
import { getShippingLane, INTERNATIONAL_LANES } from "@/lib/domain/international-lanes";

export function generateStaticParams() {
  return INTERNATIONAL_LANES.map((lane) => ({ lane: lane.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ lane: string }> }): Promise<Metadata> {
  const lane = getShippingLane((await params).lane);
  return lane ? { title: `${lane.title} · Hulakico`, description: lane.summary } : {};
}

const panel =
  "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-6";

/** One international lane — image, timing, and the paperwork that lane needs. */
export default async function ShippingLanePage({ params }: { params: Promise<{ lane: string }> }) {
  const lane = getShippingLane((await params).lane);
  if (!lane) notFound();

  return (
    <div className="shell-sky min-h-dvh">
      <PublicHeader />
      <article className="mx-auto max-w-5xl px-6 py-12 sm:px-12">
        <Link href="/services/international" className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
          ← International shipping
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">Nepal → {lane.to}</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)] sm:text-5xl">{lane.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--off-white)]/90">{lane.summary}</p>
        <div className="mt-8 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lane.image} alt="" className="h-64 w-full object-cover object-center sm:h-80" />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className={panel}>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">Timing</h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--off-white)]/85">{lane.transit}</p>
          </section>
          <section className={panel}>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">What to prepare</h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--off-white)]/85">{lane.paperwork}</p>
          </section>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <QuoteLink className="rounded-md bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110">
            Get a Quote
          </QuoteLink>
          <Link href="/book" className="rounded-md border border-[var(--off-white)] px-6 py-3 text-sm font-semibold text-[var(--off-white)] transition hover:bg-[color-mix(in_srgb,var(--off-white)_14%,transparent)]">
            Book a shipment
          </Link>
        </div>
      </article>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
