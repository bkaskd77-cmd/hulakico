import type { Metadata } from "next";
import { getCityCopies } from "@/lib/data/city-content";
import { getPublishedNotes } from "@/lib/data/desk-notes-content";
import { getLaneCopies } from "@/lib/data/lane-content";
import { getPages } from "@/lib/data/pages-content";
import { getServices } from "@/lib/data/services-content";

export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulakico.com").replace(/\/$/, "");
export const SITE_NAME = "Hulakico Logistics";
export const SITE_TAGLINE = "Hulakico Logistics — Moving Trust. Delivering More.";
export const SITE_DESCRIPTION =
  "AI logistics control tower for Nepal — domestic and international shipping through one booking brain.";

const SHARE_IMAGE = { url: "/home/hero-handover.jpg", alt: "Courier handing a parcel at the door" };

type PublicPath = { path: string; changeFrequency: "weekly" | "monthly"; priority: number };

export function siteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${clean}`;
}

function entry(path: string, changeFrequency: PublicPath["changeFrequency"], priority: number): PublicPath {
  return { path, changeFrequency, priority };
}

/** Public marketing URLs for the sitemap. Admin, account, and booking stay out. */
export async function listPublicPaths(): Promise<PublicPath[]> {
  try {
    const [services, notes, pages, cities, lanes] = await Promise.all([
      getServices(),
      getPublishedNotes(),
      getPages(),
      getCityCopies(),
      getLaneCopies(),
    ]);
    return [
      entry("/", "weekly", 1),
      entry("/contact", "monthly", 0.8),
      entry("/notes", "weekly", 0.7),
      ...services.map((item) => entry(`/services/${item.slug}`, "weekly", 0.8)),
      ...notes.map((item) => entry(`/notes/${item.slug}`, "weekly", 0.6)),
      ...pages.filter((item) => !item.standalone).map((item) => entry(`/${item.slug}`, "monthly", 0.5)),
      ...cities.map((item) => entry(`/services/domestic/${item.slug}`, "monthly", 0.6)),
      ...lanes.map((item) => entry(`/services/international/${item.slug}`, "monthly", 0.6)),
    ];
  } catch (error) {
    console.error("[site.ts:listPublicPaths]", error instanceof Error ? error.message : error);
    return [entry("/", "weekly", 1), entry("/contact", "monthly", 0.8)];
  }
}

export function siteMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: { default: SITE_TAGLINE, template: "%s" },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: ["Hulakico", "Nepal courier", "Kathmandu shipping", "international cargo Nepal"],
    openGraph: {
      type: "website",
      locale: "en_NP",
      url: SITE_ORIGIN,
      siteName: SITE_NAME,
      title: SITE_TAGLINE,
      description: SITE_DESCRIPTION,
      images: [{ url: "/home/hero-handover.jpg", alt: "Courier handing a parcel at the door" }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TAGLINE,
      description: SITE_DESCRIPTION,
      images: ["/home/hero-handover.jpg"],
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Per-page metadata: its own canonical address and share card. Without this every page
 * inherits the homepage canonical and Google treats them all as copies of the homepage.
 */
export function pageMeta(
  path: string,
  title: string,
  description?: string,
  options: { noIndex?: boolean; image?: string; imageAlt?: string } = {},
): Metadata {
  const url = siteUrl(path);
  const image = { url: options.image || SHARE_IMAGE.url, alt: options.imageAlt || SHARE_IMAGE.alt };
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: SITE_NAME, locale: "en_NP", url, title, description: description ?? SITE_DESCRIPTION, images: [image] },
    twitter: { card: "summary_large_image", title, description: description ?? SITE_DESCRIPTION, images: [image.url] },
    ...(options.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export function organizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    email: "info@hulakico.com",
    telephone: "+9779851012358",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Keshar Mahal Marga, Thamel",
      addressLocality: "Kathmandu",
      addressCountry: "NP",
    },
  });
}
