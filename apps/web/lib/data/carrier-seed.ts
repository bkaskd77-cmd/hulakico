type SeedService = {
  code: string;
  name: string;
  serviceClass: "EXPRESS" | "ECONOMY" | "FREIGHT_ASSIST";
  etaDaysMin: number;
  etaDaysMax: number;
  supportsCod: boolean;
  rates: Array<{
    currency: string;
    baseAmount: number;
    perKgAmount: number;
    zoneLabel: string;
  }>;
};

export type SeedCarrier = {
  code: string;
  name: string;
  transportMode: "THIRD_PARTY" | "OWN_FLEET";
  scope: "DOMESTIC" | "INTERNATIONAL" | "BOTH";
  isActive: boolean;
  adapterKey: string;
  services: SeedService[];
};

export const CARRIER_SEED: SeedCarrier[] = [
  {
    code: "NP_DOMESTIC",
    name: "Nepal Domestic Partner",
    transportMode: "THIRD_PARTY",
    scope: "DOMESTIC",
    isActive: true,
    adapterKey: "stub_domestic",
    services: [
      {
        code: "NP_EXPRESS",
        name: "Valley & Major City Express",
        serviceClass: "EXPRESS",
        etaDaysMin: 1,
        etaDaysMax: 2,
        supportsCod: true,
        rates: [
          { currency: "NPR", baseAmount: 150, perKgAmount: 40, zoneLabel: "valley" },
          { currency: "NPR", baseAmount: 250, perKgAmount: 55, zoneLabel: "major_city" },
        ],
      },
      {
        code: "NP_ECONOMY",
        name: "Nationwide Economy",
        serviceClass: "ECONOMY",
        etaDaysMin: 3,
        etaDaysMax: 7,
        supportsCod: true,
        rates: [
          { currency: "NPR", baseAmount: 120, perKgAmount: 30, zoneLabel: "nationwide" },
        ],
      },
    ],
  },
  {
    code: "DHL",
    name: "DHL Express (stub)",
    transportMode: "THIRD_PARTY",
    scope: "INTERNATIONAL",
    isActive: true,
    adapterKey: "stub_dhl",
    services: [
      {
        code: "DHL_EXPRESS",
        name: "DHL Express Worldwide",
        serviceClass: "EXPRESS",
        etaDaysMin: 2,
        etaDaysMax: 5,
        supportsCod: false,
        rates: [
          { currency: "USD", baseAmount: 28, perKgAmount: 9.5, zoneLabel: "world" },
        ],
      },
    ],
  },
  {
    code: "FEDEX",
    name: "FedEx (stub)",
    transportMode: "THIRD_PARTY",
    scope: "INTERNATIONAL",
    isActive: true,
    adapterKey: "stub_fedex",
    services: [
      {
        code: "FX_ECONOMY",
        name: "FedEx International Economy",
        serviceClass: "ECONOMY",
        etaDaysMin: 4,
        etaDaysMax: 8,
        supportsCod: false,
        rates: [
          { currency: "USD", baseAmount: 22, perKgAmount: 7.25, zoneLabel: "world" },
        ],
      },
    ],
  },
  {
    code: "HULAKICO_FLEET",
    name: "Hulakico Own Fleet",
    transportMode: "OWN_FLEET",
    scope: "DOMESTIC",
    isActive: false,
    adapterKey: "stub_own_fleet",
    services: [
      {
        code: "OWN_CITY",
        name: "Own Fleet City (future)",
        serviceClass: "EXPRESS",
        etaDaysMin: 0,
        etaDaysMax: 1,
        supportsCod: true,
        rates: [
          { currency: "NPR", baseAmount: 100, perKgAmount: 25, zoneLabel: "valley" },
        ],
      },
    ],
  },
];
