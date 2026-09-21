export type FormState = {
  originContactName: string;
  originCompany: string;
  originPhone: string;
  originEmail: string;
  originCountry: string;
  originCity: string;
  originPostalCode: string;
  originLine1: string;
  originLine2: string;
  destinationContactName: string;
  destinationCompany: string;
  destinationPhone: string;
  destinationEmail: string;
  destinationCountry: string;
  destinationCity: string;
  destinationPostalCode: string;
  destinationLine1: string;
  destinationLine2: string;
  packageType: string;
  serviceClass: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  currency: string;
  contents: string;
  wantsCod: boolean;
};

export type FormUpdate = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

export const BOOK_FIELD =
  "mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] bg-[var(--navy)] px-3 py-2 text-[var(--off-white)] outline-none focus:border-[var(--teal)]";

export const INITIAL_BOOK_FORM: FormState = {
  originContactName: "",
  originCompany: "",
  originPhone: "",
  originEmail: "",
  originCountry: "NP",
  originCity: "",
  originPostalCode: "",
  originLine1: "",
  originLine2: "",
  destinationContactName: "",
  destinationCompany: "",
  destinationPhone: "",
  destinationEmail: "",
  destinationCountry: "NP",
  destinationCity: "",
  destinationPostalCode: "",
  destinationLine1: "",
  destinationLine2: "",
  packageType: "PARCEL",
  serviceClass: "EXPRESS",
  weightKg: "1",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  declaredValue: "",
  currency: "NPR",
  contents: "",
  wantsCod: false,
};
