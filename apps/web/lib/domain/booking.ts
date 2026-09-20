import { z } from "zod";

export const draftBookingSchema = z
  .object({
    packageType: z.enum(["DOCUMENT", "PARCEL", "FREIGHT_LITE"]),
    serviceClass: z.enum(["EXPRESS", "ECONOMY", "FREIGHT_ASSIST"]),
    originCountry: z.string().trim().min(2).max(2),
    originCity: z.string().trim().min(2).max(80),
    originAddress: z.string().trim().min(5).max(240),
    destinationCountry: z.string().trim().min(2).max(2),
    destinationCity: z.string().trim().min(2).max(80),
    destinationAddress: z.string().trim().min(5).max(240),
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
    if (data.wantsCod && detectLane(data.originCountry, data.destinationCountry) !== "DOMESTIC") {
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
