export type CountryOption = { code: string; name: string };

/** Display full names; persist ISO codes on the form/DB. */
export const BOOKING_COUNTRIES: CountryOption[] = [
  { code: "NP", name: "Nepal" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "QA", name: "Qatar" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NO", name: "Norway" },
  { code: "CA", name: "Canada" },
];

/** Hulakico ships from Nepal: domestic stays in Nepal, international leaves Nepal. */
export const HOME_COUNTRY = "NP";

/** Countries a side may use. Only an international consignee picks from a list (never Nepal). */
export function countryOptionsFor(
  side: "origin" | "destination",
  lane: string,
): CountryOption[] {
  if (lane === "DOMESTIC" || side === "origin") {
    return BOOKING_COUNTRIES.filter((item) => item.code === HOME_COUNTRY);
  }
  return BOOKING_COUNTRIES.filter((item) => item.code !== HOME_COUNTRY);
}

/** Whether a saved or suggested address belongs on this side of the booking. */
export function countryFitsSide(
  country: string,
  side: "origin" | "destination",
  lane: string,
): boolean {
  const code = country.trim().toUpperCase();
  return countryOptionsFor(side, lane).some((item) => item.code === code);
}

/** Dial code and allowed national number length (digits after the country code, no trunk 0). */
const PHONE_RULES: Record<string, { dial: string; min: number; max: number; sample: string }> = {
  NP: { dial: "977", min: 8, max: 10, sample: "985-1234567" },
  IN: { dial: "91", min: 10, max: 10, sample: "98765 43210" },
  CN: { dial: "86", min: 10, max: 11, sample: "131 2345 6789" },
  US: { dial: "1", min: 10, max: 10, sample: "212 555 0123" },
  CA: { dial: "1", min: 10, max: 10, sample: "416 555 0123" },
  GB: { dial: "44", min: 9, max: 10, sample: "7400 123456" },
  AE: { dial: "971", min: 8, max: 9, sample: "50 123 4567" },
  QA: { dial: "974", min: 8, max: 8, sample: "3312 3456" },
  SA: { dial: "966", min: 9, max: 9, sample: "51 234 5678" },
  AU: { dial: "61", min: 9, max: 9, sample: "412 345 678" },
  JP: { dial: "81", min: 9, max: 10, sample: "90 1234 5678" },
  KR: { dial: "82", min: 9, max: 10, sample: "10 2345 6789" },
  SG: { dial: "65", min: 8, max: 8, sample: "8123 4567" },
  TH: { dial: "66", min: 8, max: 9, sample: "81 234 5678" },
  MY: { dial: "60", min: 9, max: 10, sample: "12 345 6789" },
  DE: { dial: "49", min: 7, max: 11, sample: "1512 3456789" },
  FR: { dial: "33", min: 9, max: 9, sample: "6 12 34 56 78" },
  NO: { dial: "47", min: 8, max: 8, sample: "412 34 567" },
};

export function phonePlaceholder(country: string): string {
  const rule = PHONE_RULES[country.trim().toUpperCase()];
  return rule ? `+${rule.dial} ${rule.sample}` : "+ country code and number";
}

/**
 * Tidies a typed phone to "+<dial> <number>": "00" becomes "+", a local number gets the
 * country's dial code and loses its trunk 0. A number already starting with + is kept as is.
 */
export function normalizePhone(value: string, country: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const rule = PHONE_RULES[country.trim().toUpperCase()];
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return `+${digits}`;
  if (raw.startsWith("00")) return `+${digits.slice(2)}`;
  if (!rule) return raw;
  if (digits.startsWith(rule.dial) && digits.length > rule.max) return `+${digits}`;
  return `+${rule.dial} ${digits.replace(/^0+/, "")}`;
}

/** Undefined when the phone fits the country, otherwise a short reason. */
export function phoneProblem(value: string, country: string): string | undefined {
  const digits = normalizePhone(value, country).replace(/\D/g, "");
  if (digits.length < 7) return "Phone must include at least 7 digits.";
  if (digits.length > 15) return "Phone is too long (15 digits at most).";
  const rule = PHONE_RULES[country.trim().toUpperCase()];
  if (!rule || !digits.startsWith(rule.dial)) return undefined; // other country codes: generic check only
  const national = digits.slice(rule.dial.length).length;
  if (national < rule.min || national > rule.max) {
    const size = rule.min === rule.max ? `${rule.min}` : `${rule.min}–${rule.max}`;
    return `${countryName(country)} numbers have ${size} digits after +${rule.dial}.`;
  }
  return undefined;
}

export function countryName(code: string): string {
  const found = BOOKING_COUNTRIES.find(
    (item) => item.code === code.trim().toUpperCase(),
  );
  return found?.name ?? code;
}
