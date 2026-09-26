import type { InfoGroup, InfoPage, InfoSection } from "@/lib/data/info-pages";
import { slugifyTitle } from "@/lib/domain/service-catalogue";

export const PAGE_GROUPS: InfoGroup[] = ["Company", "Support", "Legal"];
export const PAGE_LIMITS = { items: 20, sections: 12, paragraphs: 6 } as const;

const RESERVED = new Set([
  "admin", "account", "book", "signin", "signup", "services", "api", "track", "ops", "home",
]);

export type SitePage = InfoPage & { updated: string; standalone: boolean };

export function blankPage(): SitePage {
  return {
    slug: "",
    group: "Company",
    title: "",
    intro: "",
    updated: "",
    standalone: false,
    sections: [],
  };
}

export function blankSection(): InfoSection {
  return { heading: "", body: [""] };
}

export function isReservedSlug(slug: string, standalone: boolean): boolean {
  if (standalone && slug === "contact") return false;
  return RESERVED.has(slug) || slug === "contact";
}

export function cleanSlug(value: string, title: string): string {
  return slugifyTitle(value) || slugifyTitle(title);
}
