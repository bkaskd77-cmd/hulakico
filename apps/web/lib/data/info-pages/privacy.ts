import type { InfoPage } from "@/lib/data/info-pages";

export const PRIVACY_PAGE: InfoPage = {
  slug: "privacy",
  group: "Legal",
  title: "Privacy Policy",
  intro: "What information Hulakico collects, why, who we share it with, and how long we keep it.",
  updated: "October 26, 2026",
  sections: [
    { heading: "Who is responsible", body: [
      "Hulakico Logistics, Keshar Mahal Marga, Thamel, Kathmandu, Nepal. Contact: info@hulakico.com, +977 985-1012358. We handle personal information in line with Nepal's Individual Privacy Act, 2075.",
    ] },
    { heading: "What we collect", body: [
      "Your account: name, email, account type, business name for business accounts, and your password, which we store only as a secure hash.",
      "Each shipment: sender and receiver names, addresses, phone numbers and emails, the box, the goods on the customs invoice, tax or ID numbers you give, files you attach, and the delivery record (receiver's name and photo).",
      "Payments: the amount and the bank or wallet reference you type. We never ask for card numbers or bank passwords.",
      "Technical: one sign-in cookie, and IP addresses used briefly for security and to stop abuse.",
    ] },
    { heading: "Why we use it", body: [
      "To price, book, carry, clear customs for, and deliver your shipments; to show tracking; to send booking and status updates by email and, where set up, WhatsApp or SMS; to resolve holds and claims; to keep our accounts; and to keep the service secure.",
    ] },
    { heading: "Who we share it with", body: [
      "Partner carriers and, through them, customs authorities: the details needed to carry and clear the parcel.",
      "Service providers that run parts of Hulakico for us: database hosting (Turso), email (Resend), WhatsApp (Meta) and SMS gateways, address search (Geoapify), website protection (Cloudflare), and AI customs checks (Anthropic). The AI check receives only the goods descriptions, values, and destination country, never names, phones, or addresses.",
      "Anyone who has a shipment's tracking link can see its status, route, and the receiver's initials, so share it only with people involved. We do not sell personal information.",
    ] },
    { heading: "How long we keep it", body: [
      "Accounts: while the account is open. Booked shipments: kept as business records for accounting and legal reasons; they move out of your list 90 days after they finish.",
      "Unfinished drafts: deleted after 30 days without changes. Uploaded invoices: deleted 90 days after delivery or cancellation. Delivery photos: deleted after 180 days. Backups: replaced daily, the newest 14 kept.",
    ] },
    { heading: "How we protect it", body: [
      "HTTPS everywhere, hashed passwords, one-time links that expire, two-step sign-in and an activity log for every staff action, private storage for files, and nightly backups.",
    ] },
    { heading: "Your choices", body: [
      "You can ask to see, correct, or delete your information by emailing info@hulakico.com. We delete what the law does not require us to keep.",
    ] },
    { heading: "Cookies", body: [
      "We use one essential cookie that keeps you signed in for up to 14 days. We do not use advertising or tracking cookies.",
    ] },
    { heading: "Changes", body: [
      "We may update this policy; the date above shows the current version.",
    ] },
  ],
};
