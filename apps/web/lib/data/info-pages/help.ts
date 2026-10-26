import type { InfoPage } from "@/lib/data/info-pages";

export const HELP_PAGE: InfoPage = {
  slug: "help",
  group: "Support",
  title: "Help & Support",
  intro: "Quick answers to the questions senders ask most. Still stuck? Call, WhatsApp, or email us from the Contact page.",
  sections: [
    { heading: "How do I book a shipment?", body: [
      "Create a free account and confirm your email, then choose Book a shipment. Enter the sender, the receiver, and the box (weight and size in centimetres). You see the price before you pay.",
    ] },
    { heading: "How do I pay?", body: [
      "Pay by bank transfer or QR to the Hulakico account shown at payment, then type the transaction reference from your bank or wallet app. We confirm the payment before pickup and email you when it is received.",
      "On some domestic routes you can choose cash on delivery instead.",
    ] },
    { heading: "How is the price worked out?", body: [
      "We charge the higher of the actual weight and the volumetric weight. Volumetric weight is length × width × height in centimetres, divided by 5000 for international and 6000 for domestic shipments. A light but bulky box can cost more than a small heavy one.",
      "If the partner measures a different weight or size at pickup, the price can change. We tell you before the parcel moves.",
    ] },
    { heading: "What do international goods need?", body: [
      "A customs invoice: each item with a description, HS code, country of manufacture, quantity, value, and weight. Our AI check suggests the HS code and warns you about items your destination restricts.",
      "Already have your own commercial invoice? Attach it as a PDF or photo; please still list the items.",
      "Documents only (letters, certificates) need no item list.",
    ] },
    { heading: "Who pays import duties and taxes?", body: [
      "You choose on the invoice. DAP: the receiver pays any duties and taxes on arrival. DDP (for the countries listed at booking): you pay them now; we add an estimate to the price as separate lines. Customs set the final amount, and we settle any difference with you.",
    ] },
    { heading: "What can I not send?", body: [
      "Never: cash, weapons, drugs, explosives, flammable liquids or gases, and anything illegal in Nepal or the destination.",
      "Only with permits or not at all, depending on the country: medicines and ayurvedic products, food, seeds and plants, animal products, batteries, perfumes, precious metals, and antiques. Ask us before you book; our customs desk reviews anything flagged.",
    ] },
    { heading: "How do I track a shipment?", body: [
      "Enter your Hulakico AWB or tracking code in Track a shipment on the homepage, or open the link in your booking email. Share that link with the receiver. The partner's own AWB appears once the parcel is handed over.",
    ] },
    { heading: "What does On hold mean?", body: [
      "The shipment is paused, usually because customs or the partner needs a document or a detail. The tracking page says why, and when we need something from you, you can reply there.",
    ] },
    { heading: "How does cash on delivery work?", body: [
      "Where it is offered on a domestic route, the partner collects the amount from the receiver at delivery, and we pay it back to you once the partner has paid us. Your account shows the status.",
    ] },
    { heading: "How do I know it was delivered?", body: [
      "The tracking page shows Delivered with the receiver's initials. Signed in, you see the full name and a delivery photo when the partner provides one.",
    ] },
    { heading: "I forgot my password or did not get the email", body: [
      "Use Forgot password on the sign-in page; the reset link works once and expires in 30 minutes. For the confirmation email, check your spam folder, or send a new link from your account page.",
    ] },
    { heading: "How long do shipments stay in my account?", body: [
      "Active shipments stay until they finish. Delivered, cancelled, and returned shipments move out of your list after 90 days. We keep the record, so contact us if you need an older one.",
    ] },
  ],
};
