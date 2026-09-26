import type { HomepageContent } from "@/lib/domain/homepage-types";
import { SERVICE_PAGES } from "@/lib/data/service-pages";

export const DEFAULT_FEATURE_IMAGES = ["/home/feature-1.jpg", "/home/feature-2.jpg", "/home/feature-3.jpg"];
export const DEFAULT_HERO_IMAGE = "/home/hero-handover.jpg";

export const DEFAULT_HOMEPAGE: HomepageContent = {
  sectionOrder: ["track", "highlights", "services", "features"],
  hiddenSections: [],
  heroBadge: "Partnered with national & international freight networks",
  heroHeadline: "Courier & cargo from Nepal to the world.",
  heroAccent: "Courier & cargo",
  heroSubhead:
    "Book once and we match your parcel with the right freight partner — ranked by AI on price and speed, tracked on one live timeline.",
  ctaBook: "Book a shipment",
  ctaQuote: "Get the Quote",
  heroImage: DEFAULT_HERO_IMAGE,
  heroImageAlt: "Courier handing a parcel to a customer at her door",
  showHeroTimeline: true,
  heroTimelineTitle: "One live timeline",
  heroTimeline: [
    { label: "Booked", done: true },
    { label: "Picked up by partner", done: true },
    { label: "In transit", done: false },
    { label: "Delivered", done: false },
  ],
  trackTitle: "Track a shipment",
  hubTrackPlaceholder: "Hulakico AWB or tracking code",
  towerAlerts: [
    "One Hulakico AWB spans every partner lane — domestic Nepal and international.",
    "AI ranks carriers on price, ETA risk, and service fit before you book.",
  ],
  servicesEyebrow: "Services",
  servicesTitle: "What we run for every shipment.",
  serviceImages: Object.fromEntries(SERVICE_PAGES.map((page) => [page.slug, page.image])),
  featuresEyebrow: "Platform",
  featuresTitle: "Built like a control tower, not a form.",
  featuresIntro:
    "Hulakico is the middleman layer — AI ranks partners, humans stay in the loop, customers see one story.",
  features: [
    {
      title: "One booking brain",
      body: "Domestic Nepal or international — a single draft becomes ranked carrier options and a confirmed AWB.",
      image: DEFAULT_FEATURE_IMAGES[0],
    },
    {
      title: "AI lane intelligence",
      body: "ETA risk, document QC, and carrier scoring run behind the book so ops and customers share one truth.",
      image: DEFAULT_FEATURE_IMAGES[1],
    },
    {
      title: "Live exception loop",
      body: "Holds, missing docs, and COD settle stay on the same timeline — reply from track, resolve from the tower.",
      image: DEFAULT_FEATURE_IMAGES[2],
    },
  ],
  footerTagline:
    "One booking brain. Every carrier. Domestic + world — Nepal's AI-powered logistics middleman.",
  openingHours: ["Sunday – Friday: 9:00 AM – 5:00 PM", "Saturday: 9:00 AM – 3:00 PM"],
  socialLinks: { facebook: "", instagram: "", tiktok: "", linkedin: "", youtube: "" },
};
