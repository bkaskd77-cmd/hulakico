import type { Metadata } from "next";
import Link from "next/link";
import { HomeTrackSection } from "@/app/home/HomeTrackSection";
import { PublicHeader } from "@/app/home/PublicHeader";
import { SiteFooter } from "@/app/home/SiteFooter";

export const metadata: Metadata = { title: "Page not found · Hulakico", robots: { index: false, follow: true } };

const LINKS = [
  { href: "/book", label: "Book a shipment", hint: "Domestic or international" },
  { href: "/services/domestic", label: "Domestic courier", hint: "Kathmandu to every major city" },
  { href: "/services/international", label: "International shipping", hint: "Nepal to the world" },
  { href: "/contact", label: "Contact us", hint: "Phone, WhatsApp, or visit Thamel" },
];

/** Branded 404: a lost parcel still gets routed — track, book, or pick a service. */
export default function NotFound() {
  return (
    <div className="shell-sky min-h-dvh">
      <PublicHeader />
      <main className="mx-auto max-w-[78rem] px-6 pb-16 pt-12 sm:px-12 sm:pt-16">
        <p className="shell-rise text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">Error 404 · Wrong address</p>
        <h1 className="shell-rise mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-6xl">
          This page took a wrong turn.
        </h1>
        <p className="shell-rise-delay mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)]">
          The link may be old or mistyped. Track a parcel below, or pick where you wanted to go.
        </p>
        <div className="-mx-6 mt-8 sm:-mx-12">
          <HomeTrackSection title="Track a shipment" placeholder="Hulakico AWB or tracking code" />
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href}
                className="group flex h-full flex-col rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--gold)]">
                <span className="font-semibold text-[var(--off-white)]">{link.label}</span>
                <span className="mt-1 text-sm text-[var(--muted)]">{link.hint}</span>
                <span aria-hidden className="mt-4 text-sm font-semibold text-[var(--gold)] transition group-hover:translate-x-1">Go →</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
