import { z } from "zod";

export const invoiceExportReasons = [
  "SALE",
  "GIFT",
  "SAMPLE",
  "RETURN",
  "OTHER",
] as const;

/** Packaging units accepted on commercial invoice lines (customs). */
export const invoiceLineUnits = [
  "PCS",
  "BOX",
  "KG",
  "SET",
  "PAIR",
] as const;

export const commercialInvoiceLineSchema = z.object({
  description: z.string().trim().min(2).max(200),
  quantity: z.number().positive().max(100_000),
  unit: z.enum(invoiceLineUnits).default("PCS"),
  unitValue: z.number().nonnegative().max(10_000_000),
  weightKg: z.number().positive().max(1_000).optional(),
  hsCode: z.string().trim().max(20).optional(),
  countryOfOrigin: z.string().trim().min(2).max(2).optional(),
});

export const commercialInvoiceSchema = z.object({
  shipmentId: z.string().trim().min(1),
  currency: z.enum(["NPR", "USD"]),
  exportReason: z.enum(invoiceExportReasons).default("SALE"),
  notes: z.string().trim().max(500).optional(),
  lines: z.array(commercialInvoiceLineSchema).min(1).max(40),
});

export type CommercialInvoiceLineInput = z.infer<
  typeof commercialInvoiceLineSchema
>;
export type CommercialInvoiceInput = z.infer<typeof commercialInvoiceSchema>;

export type CommercialInvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitValue: number;
  lineTotal: number;
  weightKg: number | null;
  hsCode: string | null;
  countryOfOrigin: string | null;
  sortOrder: number;
};

export type CommercialInvoice = {
  id: string;
  shipmentId: string;
  currency: string;
  exportReason: string;
  notes: string | null;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
  lines: CommercialInvoiceLine[];
};

export function lineTotal(line: {
  quantity: number;
  unitValue: number;
}): number {
  return Number((line.quantity * line.unitValue).toFixed(2));
}

export function invoiceTotal(
  lines: Array<{ quantity: number; unitValue: number }>,
): number {
  return Number(
    lines.reduce((sum, line) => sum + lineTotal(line), 0).toFixed(2),
  );
}

export function invoiceTotalWeightKg(
  lines: Array<{ quantity: number; weightKg: number | null | undefined }>,
): number {
  return Number(
    lines
      .reduce((sum, line) => sum + line.quantity * (line.weightKg ?? 0), 0)
      .toFixed(3),
  );
}

export function invoiceTotalUnits(
  lines: Array<{ quantity: number }>,
): number {
  return Number(
    lines.reduce((sum, line) => sum + line.quantity, 0).toFixed(2),
  );
}
