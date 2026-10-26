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
    title: "City deliveries start in Kathmandu",
    kicker: "Nepal",
    excerpt: "Pokhara, the valley towns, and the Terai cities, all on one tracking page.",
    image: "/home/service-domestic.jpg",
    kind: "update",
    lead: "Every domestic Hulakico shipment starts in Kathmandu. It begins when we accept the box at our desk or at pickup and give it a Hulakico AWB, your tracking number.",
    sections: [
      { heading: "Where the box can go", body: "Open a city page for Pokhara, Lalitpur, Bhaktapur, Bharatpur, Hetauda, Birgunj, Biratnagar, Dharan, Itahari, Janakpur, Butwal, Nepalgunj, or Dhangadhi. Each page shows how long delivery usually takes, which address we need, and how the box travels." },
      { heading: "What stays the same", body: "The receiver gets one tracking page. The price is in NPR. If the price includes cash on delivery, the partner collects it from the receiver. If not, the shipment is prepaid." },
    ],
    points: ["Use a full street address, not only the city name.", "Put both phone numbers on the booking.", "Measure the box before you ask for a pickup."],
  },
  {
    slug: "paperwork-before-you-book",
    title: "Paperwork is listed before you book",
    kicker: "International",
    excerpt: "Each country page lists what the partner needs with the box.",
    image: "/home/service-international.jpg",
    kind: "update",
    lead: "An international booking should not surprise you at the counter. Each country page lists the papers before you pay, so a missing invoice is caught while the box is still in Kathmandu.",
    sections: [
      { heading: "Read the country page first", body: "Each country page shows a summary, the usual delivery time, key facts, where to hand over the box, and the paperwork. If a document is on that list, the partner can refuse the box without it." },
      { heading: "Keep the papers with the shipment", body: "Once you book, the papers stay on the same record as the tracking. You and our desk see the same details, not a chat thread and a separate folder." },
    ],
    points: ["Match the name on the invoice to the name on the booking.", "Describe the goods in plain language.", "Do not seal a document pouch you still need to show."],
  },
  {
    slug: "letters-skip-the-invoice",
    title: "Letters need no goods list",
    kicker: "Documents",
    excerpt: "Certificates and other papers use a shorter booking than parcels.",
    image: "/home/service-documents.jpg",
    kind: "update",
    lead: "A letter, a certificate, or a set of papers is not a parcel. Document shipping has no goods list, because there are no goods to declare.",
    sections: [
      { heading: "Use it only for papers", body: "If the envelope holds a sample, a gift, or anything with a value, book it as a parcel. Calling goods a document is how shipments get held." },
      { heading: "What the shorter form still needs", body: "We still need both names, both phones, and a full delivery address. Tracking works the same as for parcels: booked, picked up, in transit, delivered." },
    ],
    points: ["No item list for a true document shipment.", "Keep a copy of what you sent.", "Choose Express only when the date matters more than the price."],
  },
  {
    slug: "one-awb-every-city",
    title: "One tracking number for every city",
    kicker: "Nepal",
    excerpt: "The price is in NPR. Pickup, transit, and delivery stay on one tracking page.",
    image: "/home/service-domestic.jpg",
    kind: "story",
    lead: "Hulakico gives you one tracking number (AWB), whichever partner carries the box. The city can change; the number does not.",
    sections: [
      { heading: "How the price is worked out", body: "Domestic prices are in NPR. We compare the weight on the scale with the volumetric weight (length × width × height in centimetres, divided by 6000) and charge the higher one. A light but bulky carton can cost more than a small heavy one." },
      { heading: "How you follow it", body: "After pickup, the same page shows the handover to the partner, the journey, and delivery. Holds and missing details appear there too, so nothing gets lost in a separate message." },
    ],
    points: ["One Hulakico AWB from Kathmandu to the city.", "Volumetric weight uses centimetres and a divisor of 6000.", "The tracking page is the record."],
  },
  {
    slug: "partner-after-the-draft",
    title: "We choose the partner for you",
    kicker: "International",
    excerpt: "You book once. We pick the partner that fits your price and delivery date.",
    image: "/home/service-international.jpg",
    kind: "story",
    lead: "You do not have to work out which courier should carry the box. You tell us about the shipment, and we choose the partner that fits your price and date. The handover and the customs papers stay on the same record.",
    sections: [
      { heading: "What you tell us", body: "Where it goes, the weight, the size, and what is inside. From that we price the shipment and show the delivery time before you pay." },
      { heading: "What stays the same", body: "The partner may be a national courier or an international network. You and the receiver still see Hulakico tracking. If a paper is missing, the hold shows on the shipment, with the same paperwork list you saw before booking." },
    ],
    points: ["Price and delivery time shown before you pay.", "Handover instructions stay on the shipment.", "You never book twice for a second carrier."],
  },
  {
    slug: "ready-before-pickup",
    title: "What we need for a pickup",
    kicker: "Desk",
    excerpt: "Names, phones, a full address, and the box in centimetres.",
    image: "/home/hero-handover.jpg",
    kind: "more",
    lead: "A pickup fails more often because of an incomplete address than a closed road. Our Thamel desk can send a box quickly when the booking already answers the partner's questions.",
    sections: [
      { heading: "Have these five details ready", body: "Sender name and phone. Receiver name and phone. A full address at both ends. The box measured in centimetres. A short, plain description of what is inside, the way a customs officer would understand it." },
      { heading: "When the desk is open", body: "Sunday to Friday, 9:00 to 5:00. Saturday, 9:00 to 3:00. If you would rather talk than type, call +977 985-1012358 or use WhatsApp. The booking still needs the same details." },
    ],
    points: ["A landmark plus the street, not only the area.", "Both phones, in case one does not answer.", "Measure before the courier arrives."],
  },
  {
    slug: "volumetric-weight",
    title: "Why a light box can cost more",
    kicker: "Pricing",
    excerpt: "We charge the higher of scale weight and size.",
    image: "/home/feature-2.jpg",
    kind: "more",
    lead: "Couriers sell space as well as kilos. A carton of clothes can be light on the scale but costly to carry because of the room it takes.",
    sections: [
      { heading: "The domestic sum", body: "Multiply length, width, and height in centimetres, then divide by 6000. That volumetric weight is compared with the scale weight. The price uses whichever number is higher, in NPR." },
      { heading: "How to lower it", body: "A tighter carton often saves more than a cheaper service. Remove empty space before you book. Switch from a parcel to documents only when the contents really are papers." },
    ],
    points: ["Centimetres, not inches.", "Divisor 6000 for domestic shipments.", "The higher of the two weights is the one charged."],
  },
  {
    slug: "cash-on-delivery",
    title: "Cash on delivery is chosen at booking",
    kicker: "Payments",
    excerpt: "The partner collects only when the booking already includes it.",
    image: "/home/feature-3.jpg",
    kind: "more",
    lead: "Cash on delivery cannot be added once the box is on its way. You choose it when you book. If the booking does not include it, the receiver is not asked to pay at the door.",
    sections: [
      { heading: "When it is available", body: "Some domestic routes offer cash on delivery, and the price shows it before you confirm. The partner collects from the receiver, and Hulakico pays that amount back to you." },
      { heading: "When it is not", body: "If you do not see it at booking, the shipment is prepaid. Asking the courier to collect cash on the day can get a box refused or held." },
    ],
    points: ["Choose cash on delivery when you book.", "The money comes back to you through Hulakico.", "International shipments have no cash on delivery."],
  },
];
