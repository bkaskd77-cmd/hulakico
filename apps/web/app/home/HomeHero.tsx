import Link from "next/link";
import { QuoteLink } from "@/app/home/QuoteLink";
import { SiteHeader } from "@/app/home/SiteHeader";
import { WHATSAPP_PATH } from "@/app/home/social-icons";
import type { HomepageContent } from "@/lib/data/homepage-content";
import { COMPANY_CONTACT } from "@/lib/data/info-pages";

function Headline({ text, accent }: { text: string; accent: string }) {
  const index = accent ? text.indexOf(accent) : -1;
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <span className="text-[var(--gold)]">{accent}</span>
      {text.slice(index + accent.length)}
    </>
  );
}

/** Split hero: plain-language promise left, real hand-over photo with live timeline right. */
export function HomeHero({
  bookHref,
  signedIn,
  content,
}: {
  bookHref: string;
  signedIn: boolean;
  content: HomepageContent;
}) {
  const phone = COMPANY_CONTACT.phones[0];
  const steps = content.heroTimeline.filter((step) => step.label.trim());
  const activeIndex = steps.findIndex((step) => !step.done);
  return (
    <section className="home-hero relative overflow-hidden">
      <div aria-hidden className="home-hero-aurora pointer-events-none absolute inset-0 opacity-70" />
      <SiteHeader onHome signedIn={signedIn} />

      <div className="relative z-10 px-6 pb-20 pt-8 sm:px-12">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="shell-rise inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gold)_45%,transparent)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] px-3.5 py-1.5 text-xs font-medium text-[var(--off-white)]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            {content.heroBadge}
          </p>
          <h1 className="shell-rise mt-6 font-[family-name:var(--font-display)] text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[var(--off-white)]">
            <Headline text={content.heroHeadline} accent={content.heroAccent} />
          </h1>
          <p className="shell-rise-delay mt-6 max-w-lg text-base leading-relaxed text-[var(--off-white)]/90 sm:text-lg">
            {content.heroSubhead}
          </p>
          <div className="shell-rise-delay mt-9 flex flex-wrap items-center gap-4">
            <Link href={bookHref} className="inline-flex rounded-md bg-[var(--gold)] px-7 py-3.5 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110">
              {content.ctaBook}
            </Link>
            <QuoteLink onHome className="inline-flex rounded-md border border-[var(--off-white)] px-7 py-3.5 text-sm font-semibold text-[var(--off-white)] transition hover:bg-[color-mix(in_srgb,var(--off-white)_14%,transparent)]">
              {content.ctaQuote}
            </QuoteLink>
          </div>
          <p className="shell-rise-delay mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--off-white)]/75">
            Prefer to talk?
            <a href={phone.href} className="font-semibold text-[var(--off-white)] hover:text-[var(--gold)]">{phone.display}</a>
            <a href={COMPANY_CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#25D366] hover:brightness-110">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d={WHATSAPP_PATH} /></svg>
              WhatsApp
            </a>
          </p>
        </div>

        <div className="hub-enter relative">
          <div className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] shadow-2xl shadow-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.heroImage} alt={content.heroImageAlt} className="h-[26rem] w-full object-cover sm:h-[32rem]" />
          </div>
          {content.showHeroTimeline && steps.length > 0 ? (
            <div className="absolute -bottom-6 left-4 w-64 rounded-xl border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[color-mix(in_srgb,var(--navy-elevated)_92%,transparent)] p-4 shadow-xl backdrop-blur sm:-left-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">{content.heroTimelineTitle}</p>
              <ol className="mt-3 space-y-2.5">
                {steps.map((step, index) => (
                  <li key={`${index}-${step.label}`} className="hub-rank-item flex items-center gap-3 text-sm" style={{ animationDelay: `${600 + index * 180}ms` }}>
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${step.done ? "bg-[var(--gold)]" : "border border-[var(--off-white)]/40"} ${index === activeIndex ? "home-node" : ""}`} />
                    <span className={step.done ? "text-[var(--off-white)]" : "text-[var(--off-white)]/60"}>{step.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </div>
      </div>
    </section>
  );
}
