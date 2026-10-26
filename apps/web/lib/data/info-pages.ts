import { ABOUT_PAGE } from "@/lib/data/info-pages/about";
import { HELP_PAGE } from "@/lib/data/info-pages/help";
import { PRIVACY_PAGE } from "@/lib/data/info-pages/privacy";
import { TERMS_PAGE } from "@/lib/data/info-pages/terms";

export type InfoGroup = "Company" | "Support" | "Legal";

export type InfoSection = { heading: string; body: string[] };

export type InfoPage = {
  slug: string;
  group: InfoGroup;
  title: string;
  intro: string;
  updated?: string;
  standalone?: boolean;
  sections: InfoSection[];
};

export const INFO_GROUPS: InfoGroup[] = ["Company", "Support", "Legal"];

export const COMPANY_CONTACT = {
  name: "Hulakico",
  phones: [
    { label: "Mobile", display: "+977 985-1012358", href: "tel:+9779851012358" },
    { label: "Office", display: "+977-1-4517579", href: "tel:+97714517579" },
  ],
  email: "info@hulakico.com",
  whatsappHref: "https://wa.me/9779851012358",
  address: ["Keshar Mahal Marga, Thamel", "Kathmandu, Nepal"],
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=Keshar+Mahal+Marga%2C+Thamel%2C+Kathmandu",
};

export const INFO_PAGES: InfoPage[] = [
  ABOUT_PAGE,
  {
    slug: "contact",
    group: "Company",
    title: "Contact",
    intro: "Talk to the Hulakico team about bookings, a shipment on the way, business accounts, or partnerships.",
    standalone: true,
    sections: [],
  },
  HELP_PAGE,
  TERMS_PAGE,
  PRIVACY_PAGE,
];

export function getInfoPage(slug: string): InfoPage | null {
  return INFO_PAGES.find((page) => page.slug === slug) ?? null;
}
