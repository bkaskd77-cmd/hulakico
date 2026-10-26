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
    intro: "Send parcels and documents from Kathmandu to cities across Nepal through our national courier partners, with the price in NPR before you book and one tracking page for sender and receiver.",
    highlights: [
      "A clear price for each city, in NPR, with Express and Standard where both run.",
      "Cash on delivery on many routes: the courier collects from the receiver and we pay it back to you.",
      "One tracking link for the receiver, from Kathmandu to their door.",
    ],
    needs: [
      "Sender and receiver names, phone numbers, and full addresses.",
      "Weight and box size (length × width × height in cm).",
      "A short description of what is inside.",
    ],
    howItWorks: [
      "Get the price and pick Express or Standard.",
      "Pay by bank transfer or QR, or choose cash on delivery where offered.",
      "Drop the box at our Thamel desk or book a pickup, then follow it with your Hulakico AWB.",
    ],
  },
  {
    slug: "international",
    title: "International Shipping",
    tag: "Popular",
    image: "/home/service-international.jpg",
    summary: "From Nepal to the world through international freight partners, with customs paperwork built in.",
    intro: "Send documents and goods from Nepal abroad with international express partners. We help you get the customs invoice right, show duties before you pay when you cover them, and keep one tracking page from Kathmandu to the door.",
    highlights: [
      "We book the international partner that fits your price and delivery date.",
      "AI customs check: suggested HS codes and a warning for items your destination restricts, reviewed by our desk.",
      "You choose who pays import duties: the receiver on arrival (DAP), or you now, with the estimate shown before you pay (DDP, for the countries listed at booking).",
    ],
    needs: [
      "Full receiver address abroad, including postal code.",
      "For goods: each item on the customs invoice (description, HS code, country of manufacture, quantity, value, weight). You can also attach your own invoice.",
      "Accurate weight and dimensions — international rates use volumetric weight (L × W × H ÷ 5000).",
    ],
    howItWorks: [
      "Get the price for your destination.",
      "Fill in the customs invoice; the AI check helps with HS codes and restrictions.",
      "Pay, hand the box over in Kathmandu, and track it to the door.",
    ],
  },
  {
    slug: "express",
    title: "Express Courier",
    image: "/home/service-express.jpg",
    summary: "The fastest service class for urgent parcels and documents, domestic or international.",
    intro: "When the date matters, choose Express. The price shows the expected delivery days before you book, so you know what you are paying for.",
    highlights: [
      "The fastest service our partners run on your route.",
      "Expected delivery days shown before you book.",
      "Any hold or question appears on your tracking page straight away, so nothing waits on email.",
    ],
    needs: [
      "The same details as any shipment — sender, receiver, weight, size, and contents.",
      "For international goods, a complete commercial invoice so customs has what it needs.",
    ],
    howItWorks: [
      "Choose Express when you book.",
      "Check the delivery days and the price.",
      "Pay, hand over, and follow it live with your Hulakico AWB.",
    ],
  },
  {
    slug: "documents",
    title: "Document Shipping",
    image: "/home/service-documents.jpg",
    summary: "Letters, certificates, and paperwork — no goods invoice lines to fill in.",
    intro: "Letters, certificates, and paperwork, in Nepal or abroad, with a shorter booking: choose Document and there is no goods list to fill in.",
    highlights: [
      "No goods invoice lines for documents-only shipments.",
      "Available on domestic and international lanes.",
      "One tracking link to share with the receiver.",
    ],
    needs: [
      "Sender and receiver details.",
      "Envelope weight and size.",
      "Papers only: anything with a commercial value (samples, gifts) goes as a parcel.",
    ],
    howItWorks: [
      "Choose Document as the package type.",
      "Book without a goods list.",
      "Track delivery with your Hulakico AWB.",
    ],
  },
];

export function getServicePage(slug: string): ServicePage | null {
  return SERVICE_PAGES.find((page) => page.slug === slug) ?? null;
}
