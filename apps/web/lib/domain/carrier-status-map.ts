/** Map partner scan codes / labels into Hulakico shipment statuses. */

const DELIVERED = ["DELIVERED", "OK", "UD", "SUCCESS"];
const OUT = ["OUT_FOR_DELIVERY", "OFD", "OUT FOR DELIVERY", "WITH_DELIVERY_COURIER"];
const TRANSIT = [
  "IN_TRANSIT",
  "TRANSIT",
  "PICKED_UP",
  "PICKUP",
  "DEPARTED",
  "ARRIVED",
  "PROCESSED",
  "BOOKED",
  "HANDOVER_PENDING",
];
const EXCEPTION = [
  "EXCEPTION",
  "HELD",
  "CUSTOMS",
  "RETURN",
  "RTO",
  "FAILED",
  "DAMAGE",
];

export function mapPartnerStatusToHulakico(partnerStatus: string): string {
  const code = partnerStatus.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (DELIVERED.some((item) => code.includes(item) || item === code)) return "DELIVERED";
  if (EXCEPTION.some((item) => code.includes(item) || item === code)) return "EXCEPTION";
  if (OUT.some((item) => code.includes(item) || item === code)) return "OUT_FOR_DELIVERY";
  if (TRANSIT.some((item) => code.includes(item) || item === code)) {
    if (code === "BOOKED" || code === "HANDOVER_PENDING") return code;
    return "IN_TRANSIT";
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
