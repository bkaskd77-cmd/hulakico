import { z } from "zod";

export function composeAddressLine(
  line1: string,
  line2?: string,
  postalCode?: string,
): string {
  return [line1.trim(), line2?.trim(), postalCode?.trim()]
    .filter(Boolean)
    .join(", ");
}

export const draftBookingSchema = z
  .object({
    packageType: z.enum(["DOCUMENT", "PARCEL", "FREIGHT_LITE"]),
    serviceClass: z.enum(["EXPRESS", "ECONOMY", "FREIGHT_ASSIST"]),
    originContactName: z.string().trim().min(2).max(80),
    originCompany: z.string().trim().max(120).optional(),
    originPhone: z.string().trim().min(7).max(30),
    originEmail: z.string().trim().email().max(120).optional(),
    originCountry: z.string().trim().min(2).max(2),
    originCity: z.string().trim().min(2).max(80),
    originPostalCode: z.string().trim().max(20).optional(),
    originLine1: z.string().trim().min(5).max(160),
    originLine2: z.string().trim().max(160).optional(),
    destinationContactName: z.string().trim().min(2).max(80),
    destinationCompany: z.string().trim().max(120).optional(),
    destinationPhone: z.string().trim().min(7).max(30),
    destinationEmail: z.string().trim().email().max(120).optional(),
    destinationCountry: z.string().trim().min(2).max(2),
    destinationCity: z.string().trim().min(2).max(80),
    destinationPostalCode: z.string().trim().max(20).optional(),
    destinationLine1: z.string().trim().min(5).max(160),
    destinationLine2: z.string().trim().max(160).optional(),
    weightKg: z.number().positive().max(1000),
    lengthCm: z.number().positive().max(300).optional(),
    widthCm: z.number().positive().max(300).optional(),
    heightCm: z.number().positive().max(300).optional(),
    declaredValue: z.number().nonnegative().max(10_000_000).optional(),
    currency: z.enum(["NPR", "USD"]),
    contents: z.string().trim().min(2).max(240),
    wantsCod: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (
      data.wantsCod &&
      detectLane(data.originCountry, data.destinationCountry) !== "DOMESTIC"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["wantsCod"],
        message: "COD is only available on domestic Nepal lanes.",
      });
    }
  });

export type DraftBookingInput = z.infer<typeof draftBookingSchema>;

export function detectLane(
  originCountry: string,
  destinationCountry: string,
): "DOMESTIC" | "INTERNATIONAL" {
  const origin = originCountry.trim().toUpperCase();
  const destination = destinationCountry.trim().toUpperCase();
  if (origin === "NP" && destination === "NP") {
    return "DOMESTIC";
  }
  return "INTERNATIONAL";
}

export function normalizeCountry(code: string): string {
  return code.trim().toUpperCase();
}
