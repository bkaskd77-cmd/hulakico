import Link from "next/link";
import { SOCIAL_ICON_PATHS, SOCIAL_LABELS, WHATSAPP_PATH } from "@/app/home/social-icons";
import { getHomepageContent } from "@/lib/data/homepage-content";
import { SOCIAL_NETWORKS } from "@/lib/domain/social";
import { COMPANY_CONTACT } from "@/lib/data/info-pages";
import { getPages } from "@/lib/data/pages-content";
import { PAGE_GROUPS } from "@/lib/domain/page-catalogue";
import { getServices } from "@/lib/data/services-content";

const headingClass = "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]";
const linkClass = "text-[var(--off-white)]/80 transition hover:text-[var(--gold)]";
const iconClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)]";

/** Public footer: brand + socials, services, company pages, contact details and hours. */
export async function SiteFooter() {
  const content = await getHomepageContent();
  const services = await getServices();
  const pages = await getPages();
  const c = COMPANY_CONTACT;
  return (
    <footer className="home-footer relative overflow-hidden border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)]">
      <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url(/home/footer.jpg)" }} />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-[color-mix(in_srgb,var(--navy)_90%,transparent)] to-[color-mix(in_srgb,var(--navy)_75%,transparent)]" />
      <div aria-hidden className="home-footer-beam pointer-events-none absolute inset-x-0 top-0 h-px" />

      <div className="relative mx-auto grid max-w-[78rem] gap-10 px-6 pb-10 pt-16 sm:grid-cols-2 sm:px-12 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-md bg-[#ffcc00] px-3 py-1.5 leading-none">
            <svg viewBox="0 0 80 64" className="h-10 w-auto shrink-0" aria-hidden>
              <polyline points="8,36 40,8 72,36" fill="none" stroke="#0e766e" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="butt" />
              <polyline points="8,52 40,24 72,52" fill="none" stroke="#011f4b" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="butt" />
            </svg>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase leading-none tracking-[0.14em] text-[#011f4b]">
              HULAKICO
              <span className="mt-[0.22em] flex w-0 min-w-full justify-between text-[0.28em] font-bold leading-none tracking-normal">
                {"DELIVERED TO YOUR DOOR".split("").map((char, index) => (
                  <span key={index}>{char === " " ? "\u00a0" : char}</span>
                ))}
              </span>
            </span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--off-white)]/85">{content.footerTagline}</p>
          <ul className="mt-6 flex gap-2" aria-label="Social media">
            {SOCIAL_NETWORKS.map((network) => {
              const href = content.socialLinks[network]?.trim();
              const icon = (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d={SOCIAL_ICON_PATHS[network]} />
                </svg>
              );
              return (
                <li key={network}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[network]}
                      className={`${iconClass} text-[var(--off-white)] hover:border-[var(--gold)] hover:text-[var(--gold)]`}>
                      {icon}
                    </a>
                  ) : (
                    <span title={`${SOCIAL_LABELS[network]} — coming soon`} className={`${iconClass} text-[var(--off-white)]/35`}>
                      {icon}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <p className={headingClass}>Services</p>
          {services.map((service) => (
            <Link key={service.slug} href={`/services/${service.slug}`} className={linkClass}>{service.title}</Link>
          ))}
        </div>

        <div className="space-y-6 text-sm">
          {PAGE_GROUPS.map((group) => (
            <div key={group} className="flex flex-col gap-2">
              <p className={headingClass}>{group}</p>
              {pages.filter((page) => page.group === group).map((page) => (
                <Link key={page.slug} href={`/${page.slug}`} className={linkClass}>{page.title}</Link>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <p className={headingClass}>Contact us</p>
          <p className="text-[var(--off-white)]/85">{c.address.join(", ")}</p>
          {c.phones.map((phone) => (
            <a key={phone.href} href={phone.href} className={linkClass}>{phone.display}</a>
          ))}
          <a href={`mailto:${c.email}`} className={linkClass}>{c.email}</a>
          <a href={c.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#25D366] hover:brightness-110">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d={WHATSAPP_PATH} /></svg>
            Chat on WhatsApp
          </a>
          <div className="pt-1">
            {content.openingHours.map((line) => (
              <p key={line} className="text-xs text-[var(--off-white)]/70">{line}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] px-6 py-5 sm:px-12">
        <p className="mx-auto max-w-6xl text-xs text-[var(--off-white)]/65">
          © {new Date().getFullYear()} Hulakico · Kathmandu, Nepal
        </p>
      </div>
    </footer>
  );
}
