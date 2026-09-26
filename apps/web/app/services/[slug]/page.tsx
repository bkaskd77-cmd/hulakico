import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteLink } from "@/app/home/QuoteLink";
import { SiteFooter } from "@/app/home/SiteFooter";
import { SiteHeader } from "@/app/home/SiteHeader";
import { WhatsAppButton } from "@/app/home/WhatsAppButton";
import { SERVICE_PAGES, getServicePage } from "@/lib/data/service-pages";

export const dynamicParams = false;
export const revalidate = 300;

export function generateStaticParams() {
  return SERVICE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  return page ? { title: `${page.title} · Hulakico`, description: page.summary } : {};
}

const panelClass =
  "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-6";

/** Service detail page — what it is, what you need, how it works, then quote. */
export default async function ServicePageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) notFound();
  const others = SERVICE_PAGES.filter((item) => item.slug !== page.slug);

  return (
    <div className="shell-sky min-h-dvh">
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={page.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[var(--navy)] via-[color-mix(in_srgb,var(--navy)_80%,transparent)] to-[color-mix(in_srgb,var(--navy)_35%,transparent)]" />
        <div className="relative"><SiteHeader /></div>
        <div className="relative mx-auto max-w-[78rem] px-6 pb-20 pt-12 sm:px-12">
          <p className="shell-rise text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">Services</p>
          <h1 className="shell-rise mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)] sm:text-6xl">
            {page.title}
          </h1>
          <p className="shell-rise-delay mt-5 max-w-xl text-base leading-relaxed text-[var(--off-white)]/90">{page.intro}</p>
          <div className="shell-rise-delay mt-8 flex flex-wrap gap-4">
            <QuoteLink className="rounded-md bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110">
              Get a Quote
            </QuoteLink>
            <Link href="/book" className="rounded-md border border-[var(--off-white)] px-6 py-3 text-sm font-semibold text-[var(--off-white)] transition hover:bg-[color-mix(in_srgb,var(--off-white)_14%,transparent)]">
              Book a shipment
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[78rem] gap-6 px-6 py-16 sm:px-12 lg:grid-cols-3">
        {page.highlights.map((item, index) => (
          <div key={item} className={`${panelClass} hub-rank-item`} style={{ animationDelay: `${index * 90}ms` }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--teal)_24%,transparent)] text-sm font-bold text-[var(--gold)]">
              ✓
            </span>
            <p className="mt-4 text-sm leading-relaxed text-[var(--off-white)]/90">{item}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-[78rem] gap-6 px-6 pb-16 sm:px-12 lg:grid-cols-2">
        <div className={panelClass}>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">What you need</h2>
          <ul className="mt-5 space-y-3">
            {page.needs.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-[var(--off-white)]/85">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className={panelClass}>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">How it works</h2>
          <ol className="mt-5 space-y-4">
            {page.howItWorks.map((step, index) => (
              <li key={step} className="flex gap-4 text-sm leading-relaxed text-[var(--off-white)]/85">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--teal)] text-xs font-bold text-[var(--teal)]">
                  {index + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[78rem] px-6 pb-20 sm:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">More services</p>
        <ul className="mt-5 grid gap-6 sm:grid-cols-3">
          {others.map((item) => (
            <li key={item.slug}>
              <Link href={`/services/${item.slug}`} className="group block overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="h-32 w-full object-cover transition duration-500 group-hover:scale-105" />
                <p className="p-4 font-semibold text-[var(--off-white)] group-hover:text-[var(--gold)]">{item.title} →</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
