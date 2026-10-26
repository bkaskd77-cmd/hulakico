/** Short phone updates: Nepali for Nepal numbers, English for others. Same moments as email. */
export type PhoneEvent =
  | "BOOKED" | "PAID" | "HOLD" | "DELIVERED" | "CANCELLED" // to the sender
  | "RECEIVER_OUT_FOR_DELIVERY" | "RECEIVER_DELIVERED"; // to the receiver

export const SENDER_EVENTS = new Set<string>(["BOOKED", "PAID", "HOLD", "DELIVERED", "CANCELLED"]);

const LINES: Record<PhoneEvent, { en: string; ne: string }> = {
  BOOKED: { en: "Your shipment is booked.", ne: "तपाईंको पार्सल बुक भयो।" },
  PAID: { en: "We have received your payment.", ne: "तपाईंको भुक्तानी प्राप्त भयो।" },
  HOLD: {
    en: "Your shipment is on hold. We need something from you; please open the tracking page.",
    ne: "तपाईंको पार्सल रोकिएको छ। हामीलाई तपाईंबाट केही जानकारी चाहिन्छ; ट्र्याकिङ पेज हेर्नुहोस्।",
  },
  DELIVERED: { en: "Your shipment has been delivered.", ne: "तपाईंको पार्सल डेलिभर भयो।" },
  CANCELLED: {
    en: "Your shipment was cancelled. If you already paid, we will contact you about the refund.",
    ne: "तपाईंको पार्सल रद्द गरियो। भुक्तानी गरिसक्नुभएको भए फिर्ताबारे हामी सम्पर्क गर्नेछौं।",
  },
  RECEIVER_OUT_FOR_DELIVERY: {
    en: "A parcel for you is out for delivery today. Please keep your phone on.",
    ne: "तपाईंको लागि पार्सल आज डेलिभरीमा निस्किएको छ। कृपया फोन खुला राख्नुहोस्।",
  },
  RECEIVER_DELIVERED: { en: "Your parcel has been delivered.", ne: "तपाईंको पार्सल डेलिभर भयो।" },
};

export function phoneLanguage(e164: string): "en" | "ne" {
  return e164.replace(/\D/g, "").startsWith("977") ? "ne" : "en";
}

export function phoneLine(event: PhoneEvent, language: "en" | "ne"): string {
  return LINES[event][language];
}

/** Full SMS text (SMS has no template, so brand, AWB, and link are written out). */
export function smsText(event: PhoneEvent, language: "en" | "ne", awb: string, trackUrl: string): string {
  const brand = language === "ne" ? "हुलाकिको" : "Hulakico";
  const track = language === "ne" ? "ट्र्याक" : "Track";
  return `${brand}: ${phoneLine(event, language)} AWB ${awb}. ${track}: ${trackUrl}`;
}
