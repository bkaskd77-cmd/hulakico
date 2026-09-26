export const SERVICE_LIMITS = { items: 12, highlights: 6, needs: 8, howItWorks: 8, tag: 24 } as const;

export type ServiceItem = {
  slug: string;
  title: string;
  tag: string;
  image: string;
  summary: string;
  intro: string;
  highlights: string[];
  needs: string[];
  howItWorks: string[];
};

const FALLBACK_IMAGE = "/home/service-domestic.jpg";

export function slugifyTitle(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

export function blankService(): ServiceItem {
  return {
    slug: "",
    title: "",
    tag: "",
    image: FALLBACK_IMAGE,
    summary: "",
    intro: "",
    highlights: [],
    needs: [],
    howItWorks: [],
  };
}
