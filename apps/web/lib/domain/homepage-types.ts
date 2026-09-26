import type { SocialLinks } from "@/lib/domain/social";

export const HOME_SECTION_KEYS = ["track", "highlights", "services", "features"] as const;
export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

export const HOME_SECTION_LABELS: Record<HomeSectionKey, string> = {
  track: "Track a shipment box",
  highlights: "Highlights strip",
  services: "Services cards",
  features: "Platform features",
};

export type HomeFeature = { title: string; body: string; image: string };
export type HeroStep = { label: string; done: boolean };

/** Editable homepage content (public /). Hero is always first and the footer always last. */
export type HomepageContent = {
  sectionOrder: HomeSectionKey[];
  hiddenSections: HomeSectionKey[];
  heroBadge: string;
  heroHeadline: string;
  heroAccent: string;
  heroSubhead: string;
  ctaBook: string;
  ctaQuote: string;
  heroImage: string;
  heroImageAlt: string;
  showHeroTimeline: boolean;
  heroTimelineTitle: string;
  heroTimeline: HeroStep[];
  trackTitle: string;
  hubTrackPlaceholder: string;
  towerAlerts: string[];
  servicesEyebrow: string;
  servicesTitle: string;
  featuresEyebrow: string;
  featuresTitle: string;
  featuresIntro: string;
  features: HomeFeature[];
  footerTagline: string;
  openingHours: string[];
  socialLinks: SocialLinks;
};

export const HOME_LIMITS = { features: 12, towerAlerts: 8, heroTimeline: 6, openingHours: 6 } as const;
