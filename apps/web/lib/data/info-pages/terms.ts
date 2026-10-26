import type { InfoPage } from "@/lib/data/info-pages";

export const TERMS_PAGE: InfoPage = {
  slug: "terms",
  group: "Legal",
  title: "Terms & Conditions",
  intro: "The terms that apply when you quote, book, and track shipments with Hulakico Logistics.",
  updated: "October 26, 2026",
  sections: [
    { heading: "1. Our role", body: [
      "Hulakico Logistics, Keshar Mahal Marga, Thamel, Kathmandu, arranges the carriage of your shipment with partner carriers (national couriers and international express networks). The partner carries the parcel, and its conditions of carriage also apply. Where they differ from these terms on liability, the partner's terms decide what can be claimed.",
    ] },
    { heading: "2. Prices and payment", body: [
      "The price shown before you pay is based on the details you enter. We charge the higher of actual and volumetric weight. If the partner finds a different weight, size, or content, the price can change; we tell you before the parcel moves, and you may cancel instead.",
      "A booking is confirmed once payment is received, or when cash on delivery applies. Bank and QR transfers are checked by us before pickup.",
    ] },
    { heading: "3. Customs, duties, and taxes", body: [
      "You are the exporter of the goods and must describe them truthfully, with their real value. The customs invoice you sign is your declaration.",
      "DAP: the receiver pays import duties and taxes. If the receiver refuses to pay, the parcel can be returned or destroyed at the destination, and the costs of that are yours.",
      "DDP: you pay duties and taxes. The amount we show is an estimate from the destination's published rates. If customs charge more or less, we bill or refund the difference.",
      "Customs may inspect, delay, or seize goods. Hulakico is not responsible for those decisions.",
    ] },
    { heading: "4. What you must not send", body: [
      "Do not send items that the law of Nepal or the destination, or the partner's rules, forbid or restrict without the right permit (see Help & Support for common examples).",
      "Our AI customs check and our staff advice help you, but they are guidance, not a legal ruling. You stay responsible for what is in the box. We may refuse, hold, or return a shipment that we believe is not allowed.",
    ] },
    { heading: "5. Packing, addresses, and delivery", body: [
      "Pack the goods so they survive normal handling, and give full addresses and phone numbers that answer. The partner tries to deliver; if it cannot, the parcel may be held for collection or returned, and return costs are yours.",
      "Delivery is complete when the partner records it, with the receiver's name as proof of delivery.",
    ] },
    { heading: "6. Loss, damage, and claims", body: [
      "Tell us in writing within 7 days of delivery (or of the expected delivery date, if the parcel did not arrive), with photos of the box and contents. Keep the packaging until the claim is settled.",
      "Compensation is limited to what the partner pays under its conditions of carriage, and never more than the value declared on the booking or invoice. We are not liable for indirect loss (such as lost profit), or for delays caused by customs, weather, strikes, or other events outside our control.",
    ] },
    { heading: "7. Cancellations and refunds", body: [
      "Before pickup you can cancel and get the shipping price back, less any bank charges. After the partner has the parcel, shipping charges are not refunded. Refunds are paid to the account you paid from, usually within 7 working days.",
    ] },
    { heading: "8. Cash on delivery", body: [
      "Where cash on delivery is offered, we pay the collected amount to you after the partner has paid it to us. Your account shows when it is collected and settled.",
    ] },
    { heading: "9. Changes and law", body: [
      "We may update these terms; the date above shows the current version, and the version in force when you book applies to that shipment. These terms are governed by the laws of Nepal, and disputes go to the courts of Kathmandu.",
      "Questions: info@hulakico.com or +977 985-1012358.",
    ] },
  ],
};
