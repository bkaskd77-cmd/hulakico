export type FormState = {
  originCountry: string;
  originCity: string;
  originAddress: string;
  destinationCountry: string;
  destinationCity: string;
  destinationAddress: string;
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
  originCountry: "NP",
  originCity: "Kathmandu",
  originAddress: "",
  destinationCountry: "NP",
  destinationCity: "Pokhara",
  destinationAddress: "",
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
