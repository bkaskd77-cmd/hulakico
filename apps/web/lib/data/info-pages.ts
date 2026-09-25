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
  address: ["Keshar Mahal Marga, Thamel", "Kathmandu, Nepal"],
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=Keshar+Mahal+Marga%2C+Thamel%2C+Kathmandu",
};

export const INFO_PAGES: InfoPage[] = [
  {
    slug: "about",
    group: "Company",
    title: "About Hulakico",
    intro: "Nepal's AI-powered logistics middleman — one booking brain across every carrier, domestic and international.",
    sections: [
      { heading: "What we do", body: [
        "Hulakico sits between shippers and carriers. You book once with us; we compare partner carriers, confirm the best option, and give you one Hulakico AWB for the whole journey.",
        "Fulfilment runs through third-party partners such as international express networks and Nepal domestic couriers, so you get their reach without managing each one.",
      ] },
      { heading: "How it works", body: [
        "Draft a shipment with shipper, consignee, and package details. Our intelligence layer ranks carrier options on price, ETA risk, and service fit.",
        "After booking, every milestone lands on one timeline that shipper and consignee can follow from a single tracking link.",
      ] },
      { heading: "Why a control tower", body: [
        "AI does the ranking and document checks; people stay in the loop for holds, exceptions, and cash-on-delivery settlement.",
        "Customers, operations, and partners see the same record instead of chasing updates across carrier websites.",
      ] },
    ],
  },
  {
    slug: "contact",
    group: "Company",
    title: "Contact",
    intro: "Talk to the Hulakico team — bookings, shipments, business accounts, and partnerships.",
    standalone: true,
    sections: [],
  },
  {
    slug: "help",
    group: "Support",
    title: "Help & Support",
    intro: "Answers to the questions shippers ask most.",
    sections: [
      { heading: "How do I track a shipment?", body: [
        "Use Track a shipment at the top of the homepage and enter your Hulakico AWB or tracking code. The Hulakico AWB is your main reference; a partner AWB appears once the carrier has picked up the parcel.",
      ] },
      { heading: "How is the price calculated?", body: [
        "Rates use billable weight: the higher of actual weight and volumetric weight. Volumetric weight is length × width × height in cm divided by 5000 for international and 6000 for domestic shipments.",
      ] },
      { heading: "What does Hold mean?", body: [
        "A hold means the shipment is paused, usually for missing information or documents. The track page explains the reason and, when we need something from you, lets you reply so the shipment can move again.",
      ] },
      { heading: "What documents do international goods need?", body: [
        "Goods need a commercial invoice. Each line requires a description, HS code, country of manufacture, quantity, unit, unit value, and weight per item. Incomplete invoices block booking until they are fixed. Documents-only shipments do not need an invoice.",
      ] },
      { heading: "How does cash on delivery work?", body: [
        "On eligible domestic lanes the carrier collects the amount from the consignee at delivery, and Hulakico records and settles it through the COD ledger.",
      ] },
      { heading: "How long do shipments stay in my account?", body: [
        "Active shipments stay visible until they finish. Delivered, cancelled, and returned shipments are kept for 90 days and then removed.",
      ] },
    ],
  },
  {
    slug: "terms",
    group: "Legal",
    title: "Terms & Conditions",
    intro: "The terms that apply when you use Hulakico to quote, book, and track shipments.",
    updated: "September 25, 2026",
    sections: [
      { heading: "Our role", body: [
        "Hulakico arranges transport through third-party carrier partners. Physical carriage is performed by the selected carrier, and that carrier's conditions of carriage also apply to your shipment.",
      ] },
      { heading: "Quotes and charges", body: [
        "Quotes are estimates based on the details you enter. Charges are calculated on billable weight and may change if the declared weight, dimensions, or contents differ from what the carrier measures.",
        "Bookings are confirmed after the required payment is completed, except where cash on delivery applies.",
      ] },
      { heading: "Your responsibilities", body: [
        "You must provide accurate shipper and consignee details, a truthful description of contents, and complete customs documents for international goods.",
        "You must not ship items that the carrier, customs, or applicable law restricts or prohibits.",
      ] },
      { heading: "Holds and exceptions", body: [
        "Shipments can be held for missing information, documents, or payment. Delays caused by incomplete details are not the responsibility of Hulakico.",
      ] },
      { heading: "Changes to these terms", body: [
        "We may update these terms as the service grows. The date above shows the latest version.",
      ] },
    ],
  },
  {
    slug: "privacy",
    group: "Legal",
    title: "Privacy Policy",
    intro: "What information Hulakico collects, why, and how long we keep it.",
    updated: "September 25, 2026",
    sections: [
      { heading: "Information we collect", body: [
        "Account details: name, email, account type, organisation name for business accounts, and your password stored only as a secure hash.",
        "Shipment details: shipper and consignee names, addresses, phone numbers, emails, package details, and commercial invoice lines.",
      ] },
      { heading: "How we use it", body: [
        "To produce quotes, book shipments with carrier partners, show tracking, resolve holds, and send booking and status notifications.",
      ] },
      { heading: "Who we share it with", body: [
        "Carrier partners receive the shipment details they need to collect, clear, and deliver your parcel. Anyone with a shipment's tracking link can see its status and route, so share that link only with people involved in the shipment.",
      ] },
      { heading: "Cookies", body: [
        "We use one essential sign-in cookie that keeps you logged in for up to 14 days. It is not used for advertising.",
      ] },
      { heading: "Retention", body: [
        "Finished shipments (delivered, cancelled, or returned) are deleted 90 days after they finish. Account details are kept while your account exists.",
      ] },
    ],
  },
];

export function getInfoPage(slug: string): InfoPage | null {
  return INFO_PAGES.find((page) => page.slug === slug) ?? null;
}
