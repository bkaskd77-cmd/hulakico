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
    "Parcels and documents from Kathmandu to anywhere in Nepal and abroad. See the price before you book, get help with customs, and follow every step on one tracking page.",
  ctaBook: "Book a shipment",
  ctaQuote: "Get the Quote",
  heroImage: DEFAULT_HERO_IMAGE,
  heroImageAlt: "Courier handing a parcel to a customer at her door",
  showHeroTimeline: true,
  heroTimelineTitle: "Every step on one page",
  heroTimeline: [
    { label: "Booked", done: true },
    { label: "Picked up", done: true },
    { label: "In transit", done: false },
    { label: "Out for delivery", done: false },
    { label: "Delivered", done: false },
  ],
  trackTitle: "Track a shipment",
  hubTrackPlaceholder: "Hulakico AWB or tracking code",
  towerAlerts: [
    "One Hulakico tracking number, whichever partner carries your parcel.",
    "Share the tracking link with your receiver; holds and questions show up there too.",
  ],
  servicesEyebrow: "Services",
  servicesTitle: "Send it the way you need.",
  serviceImages: Object.fromEntries(SERVICE_PAGES.map((page) => [page.slug, page.image])),
  featuresEyebrow: "Why Hulakico",
  featuresTitle: "Shipping from Nepal, without the guesswork.",
  featuresIntro:
    "We book trusted partners such as DHL, FedEx, and national couriers, and stay with your parcel until it arrives.",
  features: [
    {
      title: "The price before you pay",
      body: "Domestic or international, you see the full price first, with import duties as separate lines when you pay them.",
      image: DEFAULT_FEATURE_IMAGES[0],
    },
    {
      title: "Customs help, with AI",
      body: "We suggest the HS code for each item and warn you about anything your destination restricts, before the parcel leaves Kathmandu.",
      image: DEFAULT_FEATURE_IMAGES[1],
    },
    {
      title: "Never left wondering",
      body: "If customs or the courier needs something, you see it on the tracking page and can reply there. Email updates at every key moment.",
      image: DEFAULT_FEATURE_IMAGES[2],
    },
  ],
  footerTagline:
    "Courier and cargo from Kathmandu, across Nepal and to the world.",
  openingHours: ["Sunday – Friday: 9:00 AM – 5:00 PM", "Saturday: 9:00 AM – 3:00 PM"],
  socialLinks: { facebook: "", instagram: "", tiktok: "", linkedin: "", youtube: "" },
};
