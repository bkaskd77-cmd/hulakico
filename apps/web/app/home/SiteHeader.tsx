"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QuoteLink } from "@/app/home/QuoteLink";
import { SERVICE_PAGES } from "@/lib/data/service-pages";

type NavService = { slug: string; title: string; summary: string };
type Props = { onHome?: boolean; signedIn?: boolean; services?: NavService[] };

const linkClass = "text-[var(--off-white)]/90 transition hover:text-[var(--gold)]";

/** Public site header: Track · Services ▾ · About · Contact · account · Get a Quote. */
export function SiteHeader({ onHome = false, signedIn, services }: Props) {
  const serviceLinks = services ?? SERVICE_PAGES;
  const [account, setAccount] = useState(Boolean(signedIn));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (signedIn !== undefined) return;
    fetch("/api/auth/me")
      .then((res) => setAccount(res.ok))
      .catch((error) => console.error("[SiteHeader.tsx:useEffect] session check failed:", error));
  }, [signedIn]);

  const quoteButton = (
    <QuoteLink onHome={onHome} className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110">
      Get a Quote
    </QuoteLink>
  );

  const accountLink = (
    <Link href={account ? "/account" : "/signin"} className={linkClass}>
      {account ? "Account" : "Sign in"}
    </Link>
  );

  return (
    <header className="relative z-30 px-6 py-5 sm:px-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-[var(--off-white)]">
          Hulakico
        </Link>

        <nav className="hidden items-center gap-7 text-sm lg:flex" aria-label="Main">
          <Link href="/#track" className="font-semibold text-[var(--gold)] hover:brightness-110">Track a shipment</Link>
          <div className="group relative">
            <Link href="/#services" className={`${linkClass} inline-flex items-center gap-1`}>
              Services <span aria-hidden className="text-xs">▾</span>
            </Link>
            <div className="invisible absolute left-1/2 top-full w-64 -translate-x-1/2 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <ul className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-2 shadow-xl">
                {serviceLinks.map((service) => (
                  <li key={service.slug}>
                    <Link href={`/services/${service.slug}`} className="block rounded-md px-3 py-2 hover:bg-[color-mix(in_srgb,var(--teal)_18%,transparent)]">
                      <span className="block text-sm font-semibold text-[var(--off-white)]">{service.title}</span>
                      <span className="block text-xs text-[var(--muted)]">{service.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Link href="/about" className={linkClass}>About</Link>
          <Link href="/contact" className={linkClass}>Contact</Link>
        </nav>

        <div className="hidden items-center gap-5 text-sm lg:flex">
          {accountLink}
          {quoteButton}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label="Menu"
          className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_25%,transparent)] px-3 py-1.5 text-sm text-[var(--off-white)] lg:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen ? (
        <nav className="hub-panel mx-auto mt-4 max-w-6xl space-y-1 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4 text-sm lg:hidden" aria-label="Mobile">
          <Link href="/#track" className="block py-2 font-semibold text-[var(--gold)]">Track a shipment</Link>
          <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Services</p>
          {serviceLinks.map((service) => (
            <Link key={service.slug} href={`/services/${service.slug}`} className="block py-1.5 pl-2 text-[var(--off-white)]/90">
              {service.title}
            </Link>
          ))}
          <Link href="/about" className="block py-2 text-[var(--off-white)]/90">About</Link>
          <Link href="/contact" className="block py-2 text-[var(--off-white)]/90">Contact</Link>
          <div className="flex items-center justify-between border-t border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] pt-3">
            {accountLink}
            {quoteButton}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
