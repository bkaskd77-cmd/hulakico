import type { InfoPage } from "@/lib/data/info-pages";

export const ABOUT_PAGE: InfoPage = {
  slug: "about",
  group: "Company",
  title: "About Hulakico",
  intro: "A courier and cargo desk in Thamel, Kathmandu. We book your parcel with the right partner, across Nepal and to the rest of the world.",
  sections: [
    { heading: "Who we are", body: [
      "Hulakico Logistics sends parcels and documents for people and businesses, from Kathmandu to cities across Nepal and to countries abroad.",
      "We are a small, hands-on team. You can call us, message us on WhatsApp, or bring your box to our desk on Keshar Mahal Marga, Thamel.",
    ] },
    { heading: "How we work", body: [
      "We do not run our own trucks or planes yet. We work with trusted partners: national couriers inside Nepal and international express networks such as DHL and FedEx.",
      "You book once with us. We choose the partner that fits your price and delivery time, and you get one Hulakico tracking number (AWB) for the whole journey, whichever partner carries the box.",
    ] },
    { heading: "What you get", body: [
      "The price before you pay, in NPR or USD. When you pay the receiver's import duties, they are shown as separate lines.",
      "Help with customs: we check your invoice, with the help of AI, for HS codes and items your destination restricts, before the parcel leaves Kathmandu.",
      "One tracking page for you and the receiver, and email updates at the moments that matter: booked, paid, on hold, delivered.",
      "Proof of delivery: who received the parcel, and a photo when the partner provides one.",
    ] },
    { heading: "Our promise", body: [
      "We tell you the full price, the paperwork, and any risk before you pay, not at the counter. If something goes wrong on the way, you hear it from us first, on the same tracking page.",
    ] },
  ],
};
