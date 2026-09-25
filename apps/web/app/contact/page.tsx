import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/app/contact/ContactForm";
import { COMPANY_CONTACT } from "@/lib/data/info-pages";

export const metadata: Metadata = {
  title: "Contact · Hulakico",
  description: "Call, email, or visit Hulakico in Thamel, Kathmandu — or send us a message.",
};

const MAP_EMBED =
  "https://www.openstreetmap.org/export/embed.html?bbox=85.3050%2C27.7080%2C85.3200%2C27.7200&layer=mapnik";

function Icon({ path }: { path: string }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--teal)_22%,transparent)] text-[var(--gold)]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={path} />
      </svg>
    </span>
  );
}

const PHONE_ICON = "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2";
const MAIL_ICON = "M4 6h16v12H4zM4 7l8 6 8-6";
const PIN_ICON = "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z";

const cardClass =
  "flex gap-4 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-5";

export default function ContactPage() {
  const c = COMPANY_CONTACT;
  return (
    <div className="shell-sky min-h-dvh">
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: "url(/home/footer.jpg)" }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_srgb,var(--navy)_70%,transparent)] to-[var(--navy)]" />
        <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-5 sm:px-12">
          <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-extrabold text-[var(--off-white)]">Hulakico</Link>
          <Link href="/" className="text-sm text-[var(--off-white)]/85 hover:text-[var(--gold)]">Back to home</Link>
        </header>
        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-16 pt-10 sm:px-12">
          <p className="shell-rise text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">Contact</p>
          <h1 className="shell-rise mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)] sm:text-5xl">
            Talk to the tower.
          </h1>
          <p className="shell-rise-delay mt-4 max-w-xl text-base leading-relaxed text-[var(--off-white)]/90">
            Bookings, a shipment on the move, a business account, or a partnership — call, email, visit us in Thamel, or send a message below.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-6 pb-16 sm:px-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className={cardClass}>
            <Icon path={PHONE_ICON} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Phone</p>
              {c.phones.map((phone) => (
                <a key={phone.href} href={phone.href} className="mt-1 block text-lg font-semibold text-[var(--off-white)] hover:text-[var(--gold)]">
                  {phone.display} <span className="text-xs font-normal text-[var(--muted)]">{phone.label}</span>
                </a>
              ))}
            </div>
          </div>
          <div className={cardClass}>
            <Icon path={MAIL_ICON} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Email</p>
              <a href={`mailto:${c.email}`} className="mt-1 block text-lg font-semibold text-[var(--off-white)] hover:text-[var(--gold)]">{c.email}</a>
            </div>
          </div>
          <div className={cardClass}>
            <Icon path={PIN_ICON} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Office</p>
              <p className="mt-1 font-semibold text-[var(--off-white)]">{c.name}</p>
              {c.address.map((line) => (
                <p key={line} className="text-sm text-[var(--off-white)]/85">{line}</p>
              ))}
              <a href={c.mapsHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-[var(--gold)] hover:brightness-110">
                Get directions
              </a>
            </div>
          </div>
          <p className="px-1 text-sm text-[var(--muted)]">
            Shipment on hold? Reply straight from its tracking page — see <Link href="/help" className="text-[var(--teal)] underline">Help &amp; Support</Link>.
          </p>
        </div>

        <div className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">Send us a message</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">We reply to the email you give us.</p>
          <ContactForm />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20 sm:px-12">
        <div className="overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)]">
          <iframe title="Map of Thamel, Kathmandu" src={MAP_EMBED} className="h-72 w-full grayscale-[35%]" loading="lazy" />
        </div>
        <p className="mt-6 text-xs text-[var(--off-white)]/70">© {new Date().getFullYear()} Hulakico · Kathmandu, Nepal</p>
      </section>
    </div>
  );
}
