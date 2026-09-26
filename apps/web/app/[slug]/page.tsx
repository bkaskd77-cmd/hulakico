import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/app/home/SiteFooter";
import { SiteHeader } from "@/app/home/SiteHeader";
import { WhatsAppButton } from "@/app/home/WhatsAppButton";
import { INFO_GROUPS, INFO_PAGES, getInfoPage } from "@/lib/data/info-pages";

export const dynamicParams = false;
export const revalidate = 300;

export function generateStaticParams() {
  return INFO_PAGES.filter((page) => !page.standalone).map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getInfoPage(slug);
  return page ? { title: `${page.title} · Hulakico`, description: page.intro } : {};
}

/** Company, support, and legal pages from one content source. */
export default async function InfoPageView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getInfoPage(slug);
  if (!page) notFound();

  return (
    <div className="shell-sky min-h-dvh">
      <div className="border-b border-[color-mix(in_srgb,var(--off-white)_10%,transparent)]">
        <SiteHeader />
      </div>

      <div className="mx-auto grid max-w-[78rem] gap-12 px-6 py-16 sm:px-12 lg:grid-cols-[1fr_14rem]">
        <article className="shell-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">{page.group}</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--off-white)] sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--off-white)]/90">{page.intro}</p>
          {page.updated ? (
            <p className="mt-3 text-xs text-[var(--muted)]">Last updated {page.updated}</p>
          ) : null}
          <div className="mt-12 space-y-10">
            {page.sections.map((section) => (
              <section key={section.heading} className="border-t border-[color-mix(in_srgb,var(--teal)_35%,transparent)] pt-6">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">
                  {section.heading}
                </h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--off-white)]/85">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>

        <nav aria-label="More from Hulakico" className="space-y-8 lg:sticky lg:top-8 lg:self-start">
          {INFO_GROUPS.map((group) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">{group}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {INFO_PAGES.filter((item) => item.group === group).map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/${item.slug}`}
                      className={item.slug === page.slug ? "font-semibold text-[var(--off-white)]" : "text-[var(--off-white)]/75 hover:text-[var(--gold)]"}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
