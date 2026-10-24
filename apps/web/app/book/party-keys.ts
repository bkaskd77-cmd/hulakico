export const PARTY_KEYS = {
  origin: {
    contactName: "originContactName",
    company: "originCompany",
    phone: "originPhone",
    email: "originEmail",
    country: "originCountry",
    city: "originCity",
    postal: "originPostalCode",
    line1: "originLine1",
    line2: "originLine2",
  },
  destination: {
    contactName: "destinationContactName",
    company: "destinationCompany",
    phone: "destinationPhone",
    email: "destinationEmail",
    country: "destinationCountry",
    city: "destinationCity",
    postal: "destinationPostalCode",
    line1: "destinationLine1",
    line2: "destinationLine2",
  },
} as const;

export const NP_CITIES = [
  "Kathmandu",
  "Pokhara",
  "Biratnagar",
  "Birgunj",
  "Dharan",
  "Butwal",
];

/** Quick-pick cities per country: where most shipments go. The field stays free text. */
const MAJOR_CITIES: Record<string, string[]> = {
  NP: [...NP_CITIES, "Lalitpur", "Bhaktapur", "Bharatpur", "Nepalgunj"],
  IN: ["New Delhi", "Mumbai", "Kolkata", "Bengaluru", "Chennai", "Varanasi"],
  CN: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Lhasa"],
  US: ["New York", "Los Angeles", "Chicago", "Houston", "San Francisco", "Dallas"],
  GB: ["London", "Manchester", "Birmingham", "Reading", "Aldershot", "Glasgow"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain"],
  QA: ["Doha", "Al Wakrah", "Al Khor", "Lusail"],
  SA: ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"],
  AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  JP: ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Fukuoka"],
  KR: ["Seoul", "Busan", "Incheon", "Ansan", "Daegu"],
  SG: ["Singapore"],
  TH: ["Bangkok", "Chiang Mai", "Phuket", "Pattaya"],
  MY: ["Kuala Lumpur", "Penang", "Johor Bahru", "Shah Alam"],
  DE: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"],
  FR: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"],
  NO: ["Oslo", "Bergen", "Trondheim", "Stavanger"],
  CA: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
};

export function cityChoices(country: string): string[] {
  return MAJOR_CITIES[country.trim().toUpperCase()] ?? [];
}
