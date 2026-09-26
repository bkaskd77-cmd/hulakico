export type ServicePage = {
  slug: string;
  title: string;
  tag?: string;
  image: string;
  summary: string;
  intro: string;
  highlights: string[];
  needs: string[];
  howItWorks: string[];
};

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: "domestic",
    title: "Domestic Courier",
    tag: "Popular",
    image: "/home/service-domestic.jpg",
    summary: "Parcels and documents across Nepal — Kathmandu Valley, major cities, and nationwide.",
    intro: "Send anywhere in Nepal through our national freight partners, priced by zone and tracked on one Hulakico timeline.",
    highlights: [
      "Zone pricing for Kathmandu Valley, major cities, and nationwide delivery.",
      "Cash on delivery (COD) — the partner collects from the receiver and Hulakico settles it to you.",
      "Prices in NPR, with Express and Standard options shown side by side.",
    ],
    needs: [
      "Sender and receiver names, phone numbers, and full addresses.",
      "Weight and box size (length × width × height in cm).",
      "A short description of what is inside.",
    ],
    howItWorks: [
      "Get an instant quote and pick the option that suits you.",
      "Book and pay online — or choose COD on eligible lanes.",
      "Follow every step with your Hulakico AWB.",
    ],
  },
  {
    slug: "international",
    title: "International Shipping",
    tag: "Popular",
    image: "/home/service-international.jpg",
    summary: "From Nepal to the world through international freight partners, with customs paperwork built in.",
    intro: "Ship documents and goods abroad. We compare international partners, prepare the commercial invoice with you, and keep one timeline from pickup to delivery.",
    highlights: [
      "Options from multiple international partners, ranked by AI on price, speed, and delivery risk.",
      "Digital commercial invoice that cannot be saved until every customs detail is filled in.",
      "Hulakico AWB plus the partner AWB once the parcel is handed over.",
    ],
    needs: [
      "Full receiver address abroad, including postal code.",
      "For goods: a commercial invoice line per item — description, HS code, country of manufacture, quantity, unit value, and weight.",
      "Accurate weight and dimensions — international rates use volumetric weight (L × W × H ÷ 5000).",
    ],
    howItWorks: [
      "Quote in seconds and compare partner options.",
      "Complete the invoice line by line — every customs field is required.",
      "Book, hand over, and track door to door.",
    ],
  },
  {
    slug: "express",
    title: "Express Courier",
    image: "/home/service-express.jpg",
    summary: "The fastest service class for urgent parcels and documents, domestic or international.",
    intro: "When time matters, choose Express. Every quote shows the delivery window for each Express option so you know exactly what you are paying for.",
    highlights: [
      "Fastest delivery windows available from our partners on your route.",
      "Estimated delivery days shown on every option before you book.",
      "Holds and questions surface immediately on your tracking page.",
    ],
    needs: [
      "The same details as any shipment — sender, receiver, weight, size, and contents.",
      "For international goods, a complete commercial invoice so customs has what it needs.",
    ],
    howItWorks: [
      "Select Express when you request a quote.",
      "Compare Express options and their delivery windows.",
      "Book and follow live status with your Hulakico AWB.",
    ],
  },
  {
    slug: "documents",
    title: "Document Shipping",
    image: "/home/service-documents.jpg",
    summary: "Letters, certificates, and paperwork — no goods invoice lines to fill in.",
    intro: "Send documents in Nepal or abroad with a lighter booking: mark the shipment as Document and it is checked as paperwork, not goods.",
    highlights: [
      "No goods invoice lines for documents-only shipments.",
      "Available on domestic and international lanes.",
      "One tracking link to share with the receiver.",
    ],
    needs: [
      "Sender and receiver details.",
      "Envelope weight and size.",
      "Confirmation that the shipment contains documents only.",
    ],
    howItWorks: [
      "Choose Document as the package type when you quote.",
      "Book without filling in goods invoice lines.",
      "Track delivery with your Hulakico AWB.",
    ],
  },
];

export function getServicePage(slug: string): ServicePage | null {
  return SERVICE_PAGES.find((page) => page.slug === slug) ?? null;
}
