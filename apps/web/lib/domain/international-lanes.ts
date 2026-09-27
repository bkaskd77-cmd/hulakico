export type ShippingLane = {
  slug: string;
  to: string;
  title: string;
  summary: string;
  image: string;
  transit: string;
  paperwork: string;
};

const warehouse = "/home/feature-1.jpg";
const port = "/home/feature-2.jpg";
const vessel = "/home/feature-3.jpg";
const air = "/home/service-international.jpg";
const express = "/home/service-express.jpg";
const docs = "/home/service-documents.jpg";

/** International lanes shown on the International Shipping page. */
export const INTERNATIONAL_LANES: ShippingLane[] = [
  { slug: "india", to: "India", title: "Nepal to India", summary: "Parcels and documents by air or road, with a full receiver address in India.", image: warehouse, transit: "Air and road options. The quote shows the delivery window before you book.", paperwork: "Receiver address with PIN code. Goods need a commercial invoice line for each item." },
  { slug: "gulf", to: "UAE", title: "Nepal to the UAE", summary: "Documents and personal goods into Dubai, Abu Dhabi, and the wider Emirates.", image: port, transit: "Usually air freight. Delivery days appear on the quote for the partner you pick.", paperwork: "Full UAE address and phone. Declare personal effects honestly so customs can clear them." },
  { slug: "united-states", to: "United States", title: "Nepal to the United States", summary: "Documents and commercial goods, with the invoice completed before handover.", image: vessel, transit: "Air to the US. Customs time sits outside the flight window and shows as a risk note on the quote.", paperwork: "Street, city, state, and ZIP. Each goods line needs description, HS code, origin, quantity, value, and weight." },
  { slug: "united-kingdom", to: "United Kingdom", title: "Nepal to the United Kingdom", summary: "Door-to-door into the UK, with the postcode checked before booking.", image: air, transit: "Air freight. The receiver may pay duty on arrival; the quote does not hide that.", paperwork: "Full UK address including postcode. Goods need item values in the commercial invoice." },
  { slug: "australia", to: "Australia", title: "Nepal to Australia", summary: "Documents and declared goods. Food, plants, and wood need extra care.", image: express, transit: "Air into Australia. Biosecurity checks can add time after landing.", paperwork: "Australian address and postcode. List contents exactly — vague words delay clearance." },
  { slug: "china", to: "China", title: "Nepal to China", summary: "Commercial parcels into mainland cities, invoice first, then handover.", image: warehouse, transit: "Air. Partner handover adds the carrier AWB beside your Hulakico AWB.", paperwork: "Chinese address in full, plus a phone that answers. Invoice lines for every product." },
  { slug: "qatar", to: "Qatar", title: "Nepal to Qatar", summary: "Documents and personal shipments into Doha.", image: port, transit: "Air. The quote ranks partners on price, speed, and delivery risk.", paperwork: "Doha address and mobile number. Say whether the box is documents or goods." },
  { slug: "japan", to: "Japan", title: "Nepal to Japan", summary: "Small parcels and documents, described line by line.", image: docs, transit: "Air. Japan customs reads the invoice, so each line must match the box.", paperwork: "Japanese address with postal code. Brand, quantity, and material on goods lines." },
  { slug: "singapore", to: "Singapore", title: "Nepal to Singapore", summary: "A short air lane for documents and compact commercial parcels.", image: vessel, transit: "Air. Compact boxes often clear faster than oversized freight.", paperwork: "Singapore address and postal code. Volumetric weight (L × W × H ÷ 5000) sets the rate." },
  { slug: "malaysia", to: "Malaysia", title: "Nepal to Malaysia", summary: "Documents and goods into Kuala Lumpur and other Malaysian cities.", image: air, transit: "Air. Delivery window is confirmed on the quote, not guessed on this page.", paperwork: "Full address and postcode. Commercial invoice for anything that is not a document." },
  { slug: "south-korea", to: "South Korea", title: "Nepal to South Korea", summary: "Parcels into Seoul and other Korean cities, contents listed clearly.", image: express, transit: "Air. Holds show on your Hulakico tracking page if customs asks a question.", paperwork: "Korean address and phone. Item description, quantity, and value on each line." },
  { slug: "europe", to: "Europe", title: "Nepal to Europe", summary: "Germany, France, Norway, and other European addresses on one lane card.", image: docs, transit: "Air into Europe. The exact country and city are chosen when you quote.", paperwork: "European address with postal code. Duties may be collected from the receiver." },
];

export function getShippingLane(slug: string): ShippingLane | null {
  return INTERNATIONAL_LANES.find((lane) => lane.slug === slug) ?? null;
}
