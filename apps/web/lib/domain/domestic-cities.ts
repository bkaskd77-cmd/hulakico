import type { ShippingLane } from "@/lib/domain/international-lanes";

const road = "/home/service-domestic.jpg";
const yard = "/home/feature-1.jpg";
const gate = "/home/feature-2.jpg";
const move = "/home/feature-3.jpg";
const express = "/home/service-express.jpg";
const docs = "/home/service-documents.jpg";

/** Major Nepal cities shown on the Domestic Courier page. Kathmandu is the handover city. */
export const DOMESTIC_CITIES: ShippingLane[] = [
  { slug: "pokhara", to: "Pokhara", title: "Kathmandu to Pokhara", summary: "Parcels and documents over the Prithvi Highway into Lakeside, Damside, and the wider Pokhara valley.", image: road, transit: "Road via Mugling. The quote shows the delivery window before you book.", paperwork: "Ward or tole, a landmark, and a phone that answers. “Lakeside” alone is not a delivery point." },
  { slug: "lalitpur", to: "Lalitpur", title: "Kathmandu to Lalitpur", summary: "A short valley run into Patan, Jawalakhel, Ekantakuna, Satdobato, and the southern wards.", image: yard, transit: "Inside the valley. Same-day windows appear on the quote when a partner offers them.", paperwork: "Ward number, tole, and a landmark. Patan Durbar Square is not a full address." },
  { slug: "bhaktapur", to: "Bhaktapur", title: "Kathmandu to Bhaktapur", summary: "Valley delivery into Bhaktapur, Suryabinayak, and the eastern wards.", image: gate, transit: "A short valley road. Narrow lanes need a tole the rider can find.", paperwork: "Ward, tole, and a phone. Name the courtyard or lane, not only the city." },
  { slug: "bharatpur", to: "Bharatpur", title: "Kathmandu to Bharatpur", summary: "Chitwan’s city run through Narayanghat, for homes and shops along the junction.", image: move, transit: "Road to the East-West junction at Narayanghat. The quote sets the day, not this page.", paperwork: "Ward and a landmark near the address. A working receiver phone keeps the box moving." },
  { slug: "hetauda", to: "Hetauda", title: "Kathmandu to Hetauda", summary: "Makwanpur’s industrial town, a shorter southbound run for factory and household parcels.", image: express, transit: "Road south from Kathmandu. The window on the quote is the one to trust.", paperwork: "Factory or house address with ward. “Hetauda industrial estate” needs a gate or plot." },
  { slug: "birgunj", to: "Birgunj", title: "Kathmandu to Birgunj", summary: "Commercial parcels and documents into Parsa’s dry-port city.", image: docs, transit: "Road to the southern border city. Delivery days show on the quote.", paperwork: "Ward, a street landmark, and a phone. The dry port is not the receiver’s door." },
  { slug: "biratnagar", to: "Biratnagar", title: "Kathmandu to Biratnagar", summary: "The eastern industrial city in Morang — documents, samples, and household boxes.", image: road, transit: "A longer East-West road run. The quote includes that extra time.", paperwork: "Full ward address and a phone that is answered during delivery hours." },
  { slug: "dharan", to: "Dharan", title: "Kathmandu to Dharan", summary: "Hill-town delivery in Sunsari, past the bazaar and out to the wards.", image: yard, transit: "Road east, then up into Dharan. The quote window covers both.", paperwork: "Ward and a landmark. The clock tower is a meeting point, not an address." },
  { slug: "itahari", to: "Itahari", title: "Kathmandu to Itahari", summary: "The Sunsari junction, a practical drop for shops and homes where the highways meet.", image: gate, transit: "Road to the eastern junction. Partner timing is confirmed on the quote.", paperwork: "Chowk or ward plus a landmark. “Itahari chowk” needs the side of the road and a phone." },
  { slug: "janakpur", to: "Janakpur", title: "Kathmandu to Janakpur", summary: "Madhesh delivery into Janakpurdham and the Dhanusha wards around it.", image: move, transit: "Road via the East-West highway. Name the ward when you quote.", paperwork: "Ward, tole, and phone. The temple area is not a complete receiver address." },
  { slug: "butwal", to: "Butwal", title: "Kathmandu to Butwal", summary: "Rupandehi’s traffic city, the Lumbini gateway for parcels and documents.", image: express, transit: "Road west to Butwal. A landmark beside the address keeps the rider from circling.", paperwork: "Ward or chowk, a shop landmark, and a receiver phone." },
  { slug: "nepalgunj", to: "Nepalgunj", title: "Kathmandu to Nepalgunj", summary: "Banke’s western hub for documents and parcels that need a full day on the road.", image: docs, transit: "A long western road run. The quote shows the window before you pay.", paperwork: "Address inside Nepalgunj, not only the district. Include ward and phone." },
  { slug: "dhangadhi", to: "Dhangadhi", title: "Kathmandu to Dhangadhi", summary: "The far-west city in Kailali — the longest of these city runs.", image: road, transit: "Road across the country. The quote window includes the extra days on the highway.", paperwork: "Ward, a landmark, and a phone. COD follows the quote, not a promise on this page." },
];

export function getDomesticCity(slug: string): ShippingLane | null {
  return DOMESTIC_CITIES.find((city) => city.slug === slug) ?? null;
}
