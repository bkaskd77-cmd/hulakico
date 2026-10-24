import type { SavedAddress } from "@/lib/data/addresses";

const MAX_SAVED = 3;

function words(value: string): string[] {
  return value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length >= 2);
}

/**
 * Saved addresses that match what the customer is typing, best first.
 * Every typed word must start a word in the label, company, contact, street, or city,
 * so "durb kath" finds "Durbar Marg, Kathmandu". Exact-label hits rank above partial ones.
 */
export function matchSavedAddresses(query: string, saved: SavedAddress[]): SavedAddress[] {
  const typed = words(query);
  if (!typed.length) return [];
  const scored = saved.flatMap((address) => {
    const hay = words([address.label, address.company ?? "", address.contactName, address.line1, address.line2 ?? "", address.city].join(" "));
    const hits = typed.every((word) => hay.some((candidate) => candidate.startsWith(word)));
    if (!hits) return [];
    const labelBonus = address.label.toLowerCase().startsWith(query.trim().toLowerCase()) ? 2 : 0;
    const lineBonus = address.line1.toLowerCase().includes(query.trim().toLowerCase()) ? 1 : 0;
    return [{ address, score: labelBonus + lineBonus }];
  });
  return scored
    .sort((a, b) => b.score - a.score || b.address.createdAt.localeCompare(a.address.createdAt))
    .slice(0, MAX_SAVED)
    .map((item) => item.address);
}
