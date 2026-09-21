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

export function countryName(code: string): string {
  const found = BOOKING_COUNTRIES.find(
    (item) => item.code === code.trim().toUpperCase(),
  );
  return found?.name ?? code;
}
