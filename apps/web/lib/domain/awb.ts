import { randomBytes } from "node:crypto";

// Crockford base32: no I, L, O, or U, so codes read cleanly over the phone.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const GROUPS = 3;
const GROUP_SIZE = 4;

/**
 * New Hulakico AWB, e.g. HK-7Q4M-2X9K-PA3R. 12 random characters (60 bits), so
 * the public tracking page cannot be found by guessing codes.
 */
export function newHulakicoAwb(): string {
  const bytes = randomBytes(GROUPS * GROUP_SIZE);
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]);
  const groups: string[] = [];
  for (let i = 0; i < GROUPS; i += 1) groups.push(chars.slice(i * GROUP_SIZE, (i + 1) * GROUP_SIZE).join(""));
  return `HK-${groups.join("-")}`;
}

/**
 * Comparable form of any AWB a customer types: upper case, no spaces or dashes,
 * and the look-alike letters O, I, and L read as 0, 1, and 1.
 * Older AWBs (HK-FDC96594, long hex codes) normalise the same way, so they still match.
 */
export function normalizeAwb(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
}
