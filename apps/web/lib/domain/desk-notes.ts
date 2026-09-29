export type DeskSection = { heading: string; body: string };
export type DeskNote = {
  slug: string;
  title: string;
  kicker: string;
  excerpt: string;
  image: string;
  kind: "update" | "story" | "more";
  lead: string;
  sections: DeskSection[];
  points: string[];
};

export const DESK_NOTES: DeskNote[] = [
  {
    slug: "city-runs-from-kathmandu",
    title: "City runs leave from Kathmandu",
    kicker: "Nepal",
    excerpt: "Pokhara, the valley towns, and the Terai cities share one tracking page.",
    image: "/home/service-domestic.jpg",
    kind: "update",
    lead: "Kathmandu is the handover city. A domestic Hulakico run does not start in the destination. It starts when the box is accepted in Kathmandu and given one air waybill.",
    sections: [
      { heading: "Where the box can go", body: "Open a city page for Pokhara, Lalitpur, Bhaktapur, Bharatpur, Hetauda, Birgunj, Biratnagar, Dharan, Itahari, Janakpur, Butwal, Nepalgunj, or Dhangadhi. Each page is the same kind of note: how long the lane usually takes, which address we need, and how the box leaves the valley." },
      { heading: "What stays the same", body: "The receiver still gets one tracking page. The price is in NPR. If the quote includes cash on delivery, the partner collects it. If the quote does not, the lane is prepaid only." },
    ],
    points: ["Use a full street address, not only the city name.", "Put both phone numbers on the booking.", "Measure the box before you ask for a pickup."],
  },
  {
    slug: "paperwork-before-you-book",
    title: "Paperwork is listed before you book",
    kicker: "Overseas",
    excerpt: "Each overseas lane shows what the partner needs with the box.",
    image: "/home/service-international.jpg",
    kind: "update",
    lead: "An international booking should not surprise you at the counter. The lane page lists the papers before you pay, so a missing invoice is caught while the box is still in Kathmandu.",
    sections: [
      { heading: "Read the lane first", body: "Each country page carries the summary, the usual transit, the facts we can stand behind, the handover, and the paperwork. If a document is on that list, the freight partner can refuse the box without it." },
      { heading: "Keep the papers with the shipment", body: "Once you book, that list stays on the same air waybill as the tracking. Ops and the sender are looking at one story, not a chat thread and a separate folder." },
    ],
    points: ["Match the name on the invoice to the name on the booking.", "Describe the goods in plain language.", "Do not seal a document pouch you still need to show."],
  },
  {
    slug: "letters-skip-the-invoice",
    title: "Letters skip the goods invoice",
    kicker: "Documents",
    excerpt: "Certificates and paperwork use a shorter booking than parcels.",
    image: "/home/service-documents.jpg",
    kind: "update",
    lead: "A letter, a certificate, or a set of papers is not a parcel. Document shipping skips the goods-invoice lines because there are no goods to declare.",
    sections: [
      { heading: "Use it only for papers", body: "If the envelope holds a sample, a gift, or anything with a commercial value, book it as a parcel. Calling goods a document is how shipments get held." },
      { heading: "What the shorter form still needs", body: "We still need both names, both phones, and a full delivery address. The tracking timeline is the same one used for parcels: booked, picked up, in transit, delivered." },
    ],
    points: ["No item lines for a true document shipment.", "Keep a copy of what you sent.", "Ask for Express only when the date matters more than the fare."],
  },
  {
    slug: "one-awb-every-city",
    title: "One air waybill for every city",
    kicker: "Nepal",
    excerpt: "The quote is in NPR. Pickup, transit, and delivery stay on one timeline.",
    image: "/home/service-domestic.jpg",
    kind: "story",
    lead: "Hulakico does not give you a different tracking number for every partner. The city can change. The air waybill does not.",
    sections: [
      { heading: "How the price is built", body: "Domestic quotes are in NPR. We compare the weight on the scale with the volumetric weight, length times width times height in centimetres divided by 6000, and charge the higher one. A light but bulky carton can cost more than a small heavy one." },
      { heading: "How you follow it", body: "After pickup, the same page shows the hand-off to the partner, the time on the road, and delivery. Holds and missing details stay on that timeline instead of arriving as a separate message you cannot match to the box." },
    ],
    points: ["One air waybill from Kathmandu to the city.", "Volumetric weight uses centimetres and a divisor of 6000.", "The timeline is the record, not a side conversation."],
  },
  {
    slug: "partner-after-the-draft",
    title: "The partner is chosen after the draft",
    kicker: "Overseas",
    excerpt: "You book once. Hulakico ranks freight partners on price and speed.",
    image: "/home/service-international.jpg",
    kind: "story",
    lead: "You do not have to guess which network should carry the box. You describe the shipment. Hulakico ranks the partners. The booking then keeps the handover and the customs list on that same record.",
    sections: [
      { heading: "What the draft contains", body: "Origin, destination, weight, size, and what is inside. From that draft the ranked options appear, with price and speed side by side. You confirm one. That confirmation is the air waybill." },
      { heading: "What does not change later", body: "The partner may be a national or an international network. The customer still sees Hulakico tracking. If a paper is missing, the hold is on the shipment, and the paperwork list is the one shown before you booked." },
    ],
    points: ["Ranked on price and speed before you confirm.", "Handover instructions stay on the shipment.", "You are not asked to retype the booking for a second carrier."],
  },
  {
    slug: "ready-before-pickup",
    title: "What the pickup desk needs",
    kicker: "Desk",
    excerpt: "Names, phones, a full address, and the box in centimetres.",
    image: "/home/hero-handover.jpg",
    kind: "more",
    lead: "A pickup fails more often on a thin address than on a closed road. The Thamel desk can move a box only when the booking already answers the questions the partner will ask.",
    sections: [
      { heading: "Bring these five facts", body: "Sender name and phone. Receiver name and phone. A full address at both ends. The box measured in centimetres. A short description of what is inside, written the way a customs officer would understand it." },
      { heading: "When the desk is open", body: "Sunday to Friday, 9:00 to 5:00. Saturday, 9:00 to 3:00. If you would rather talk than type, call +977 985-1012358 or use WhatsApp. The booking still has to carry the same facts." },
    ],
    points: ["Landmark plus street, not only a neighbourhood.", "Both phones, in case one does not answer.", "Measure before the courier arrives."],
  },
  {
    slug: "volumetric-weight",
    title: "Why a light box can cost more",
    kicker: "Pricing",
    excerpt: "We charge the higher of scale weight and size.",
    image: "/home/feature-2.jpg",
    kind: "more",
    lead: "Freight partners sell space as well as kilos. A carton of clothes can be light on the scale and expensive on the truck because of the room it takes.",
    sections: [
      { heading: "The domestic sum", body: "Multiply length, width, and height in centimetres, then divide by 6000. That volumetric weight is compared with the scale weight. The quote uses whichever number is higher, in NPR." },
      { heading: "How to lower it", body: "A tighter carton often beats a cheaper fare class. Remove empty space before you book. If you switch from a parcel to documents, do that only when the contents really are papers." },
    ],
    points: ["Centimetres, not inches.", "Divisor 6000 on domestic runs.", "The higher of the two weights is the one billed."],
  },
  {
    slug: "cash-on-delivery",
    title: "Cash on delivery is part of the quote",
    kicker: "Payments",
    excerpt: "The partner collects only when the booking already includes it.",
    image: "/home/feature-3.jpg",
    kind: "more",
    lead: "Cash on delivery is not a switch you can add after the box is on the road. It is a term of the quote. If the quote does not include it, the receiver is not asked to pay the partner at the door.",
    sections: [
      { heading: "When it is available", body: "Some domestic lanes can include cash on delivery. The quote says so before you confirm. The partner collects from the receiver, and Hulakico settles that amount back to you." },
      { heading: "When it is not", body: "If you do not see it on the quote, the shipment is prepaid. Asking the courier to collect cash on the day of delivery is how a box gets refused or held." },
    ],
    points: ["Look for cash on delivery on the quote itself.", "Settlement comes back through Hulakico, not as loose cash.", "Overseas lanes follow the paperwork list, not a doorstep collection."],
  },
];

/** Finds one desk note. Unknown slugs return an error string instead of null. */
export function getDeskNote(slug: string): { note: DeskNote } | { error: string } {
  try {
    const note = DESK_NOTES.find((item) => item.slug === slug);
    if (!note) return { error: `No desk note for ${slug}.` };
    return { note };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Desk note lookup failed.";
    console.error("[desk-notes.ts:getDeskNote]", message);
    return { error: message };
  }
}
