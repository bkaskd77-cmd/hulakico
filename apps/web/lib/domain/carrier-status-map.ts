/** Map partner scan codes / labels into Hulakico shipment statuses. */

const EXACT: Record<string, string> = {
  DELIVERED: "DELIVERED",
  OK: "DELIVERED",
  UD: "DELIVERED",
  SUCCESS: "DELIVERED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  OFD: "OUT_FOR_DELIVERY",
  WITH_DELIVERY_COURIER: "OUT_FOR_DELIVERY",
  IN_TRANSIT: "IN_TRANSIT",
  TRANSIT: "IN_TRANSIT",
  PICKED_UP: "IN_TRANSIT",
  PICKUP: "IN_TRANSIT",
  DEPARTED: "IN_TRANSIT",
  ARRIVED: "IN_TRANSIT",
  PROCESSED: "IN_TRANSIT",
  BOOKED: "BOOKED",
  HANDOVER_PENDING: "HANDOVER_PENDING",
  EXCEPTION: "EXCEPTION",
  HELD: "EXCEPTION",
  CUSTOMS: "EXCEPTION",
  RETURN: "EXCEPTION",
  RTO: "RTO",
  FAILED: "EXCEPTION",
  DAMAGE: "EXCEPTION",
};

const PHRASE_RULES: Array<{ needle: string; status: string }> = [
  { needle: "OUT FOR DELIVERY", status: "OUT_FOR_DELIVERY" },
  { needle: "OUT_FOR_DELIVERY", status: "OUT_FOR_DELIVERY" },
  { needle: "DELIVERED", status: "DELIVERED" },
  { needle: "IN TRANSIT", status: "IN_TRANSIT" },
  { needle: "IN_TRANSIT", status: "IN_TRANSIT" },
  { needle: "HANDOVER", status: "HANDOVER_PENDING" },
  { needle: "EXCEPTION", status: "EXCEPTION" },
];

export function mapPartnerStatusToHulakico(partnerStatus: string): string {
  const raw = partnerStatus.trim().toUpperCase();
  const code = raw.replace(/[\s-]+/g, "_");
  if (EXACT[code]) return EXACT[code];
  for (const rule of PHRASE_RULES) {
    if (raw.includes(rule.needle) || code.includes(rule.needle.replace(/\s+/g, "_"))) {
      return rule.status;
    }
  }
  return "IN_TRANSIT";
}

/** Prefer the most advanced milestone from a list of partner events. */
export function latestHulakicoStatus(partnerStatuses: string[]): string {
  const rank: Record<string, number> = {
    BOOKED: 1,
    HANDOVER_PENDING: 2,
    IN_TRANSIT: 3,
    OUT_FOR_DELIVERY: 4,
    DELIVERED: 5,
    EXCEPTION: 6,
    RTO: 6,
  };
  let best = "IN_TRANSIT";
  let bestRank = 0;
  for (const status of partnerStatuses) {
    const mapped = mapPartnerStatusToHulakico(status);
    const score = rank[mapped] ?? 3;
    if (score >= bestRank) {
      best = mapped;
      bestRank = score;
    }
  }
  return best;
}
