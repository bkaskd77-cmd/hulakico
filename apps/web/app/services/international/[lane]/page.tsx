import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/app/home/PublicHeader";
import { SiteFooter } from "@/app/home/SiteFooter";
import { WhatsAppButton } from "@/app/home/WhatsAppButton";
import { getLaneCopies } from "@/lib/data/lane-content";
import { INTERNATIONAL_LANES, type ShippingLane } from "@/lib/domain/international-lanes";
import { LaneBrief } from "@/app/services/international/[lane]/LaneBrief";
import { LaneRail } from "@/app/services/international/[lane]/LaneRail";

function asLane(copy: { slug: string; to: string; title: string; summary: string; image: string; defaultImage: string; transit: string; paperwork: string }): ShippingLane {
  return { slug: copy.slug, to: copy.to, title: copy.title, summary: copy.summary, image: copy.image || copy.defaultImage, transit: copy.transit, paperwork: copy.paperwork };
}

export function generateStaticParams() {
  return INTERNATIONAL_LANES.map((lane) => ({ lane: lane.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ lane: string }> }): Promise<Metadata> {
  const slug = (await params).lane;
  const lanes = (await getLaneCopies()).map(asLane);
  const lane = lanes.find((item) => item.slug === slug);
  return lane ? { title: `${lane.title} · Hulakico`, description: lane.summary } : {};
}

/** One international destination: a full lane brief beside the quote desk. */
export default async function ShippingLanePage({ params }: { params: Promise<{ lane: string }> }) {
  const slug = (await params).lane;
  const lanes = (await getLaneCopies()).map(asLane);
  const lane = lanes.find((item) => item.slug === slug);
  if (!lane) notFound();
  const others = lanes.filter((item) => item.slug !== lane.slug);

  return (
    <div className="shell-sky min-h-dvh">
      <PublicHeader />
      <article className="mx-auto max-w-6xl px-6 py-12 sm:px-12">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-[var(--off-white)]/70">
          <Link href="/" className="hover:text-[var(--teal)]">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/services/international" className="font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
            International shipping
          </Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--off-white)]">{lane.title}</span>
        </nav>
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <LaneBrief lane={lane} />
          <LaneRail lane={lane} others={others} />
        </div>
      </article>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
