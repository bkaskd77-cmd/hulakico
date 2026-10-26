import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/app/home/PublicHeader";
import { SiteFooter } from "@/app/home/SiteFooter";
import { WhatsAppButton } from "@/app/home/WhatsAppButton";
import { LaneBrief } from "@/app/services/international/[lane]/LaneBrief";
import { LaneRail } from "@/app/services/international/[lane]/LaneRail";
import { getCityCopies, getCityCopy } from "@/lib/data/city-content";
import { DOMESTIC_CITIES } from "@/lib/domain/domestic-cities";
import type { ShippingLane } from "@/lib/domain/international-lanes";
import { pageMeta } from "@/lib/seo/site";

function asCity(copy: { slug: string; to: string; title: string; summary: string; image: string; defaultImage: string; transit: string; paperwork: string }): ShippingLane {
  return { slug: copy.slug, to: copy.to, title: copy.title, summary: copy.summary, image: copy.image || copy.defaultImage, transit: copy.transit, paperwork: copy.paperwork };
}

export function generateStaticParams() {
  return DOMESTIC_CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const slug = (await params).city;
  const city = (await getCityCopies()).map(asCity).find((item) => item.slug === slug);
  return city ? pageMeta(`/services/domestic/${city.slug}`, `${city.title} · Hulakico`, city.summary, { image: city.image, imageAlt: city.title }) : {};
}

/** One Nepal city: the same lane brief and desk used on international destinations. */
export default async function DomesticCityPage({ params }: { params: Promise<{ city: string }> }) {
  const slug = (await params).city;
  const cities = (await getCityCopies()).map(asCity);
  const city = cities.find((item) => item.slug === slug);
  if (!city) notFound();
  const others = cities.filter((item) => item.slug !== city.slug);

  return (
    <div className="shell-sky min-h-dvh">
      <PublicHeader />
      <article className="mx-auto max-w-6xl px-6 py-12 sm:px-12">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-[var(--off-white)]/70">
          <Link href="/" className="hover:text-[var(--teal)]">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/services/domestic" className="font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
            Domestic courier
          </Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--off-white)]">{city.title}</span>
        </nav>
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <LaneBrief lane={city} loadCopy={getCityCopy} kicker="Delivery from Kathmandu" />
          <LaneRail
            lane={city}
            others={others}
            hrefBase="/services/domestic"
            fromLabel="Kathmandu"
            blurb="Tell us the ward, the weight, and what is inside. We quote in NPR and confirm the delivery date before you book."
            listTitle="Other cities"
          />
        </div>
      </article>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
