import { z } from "zod";

export const invoiceExportReasons = [
  "SALE",
  "GIFT",
  "SAMPLE",
  "RETURN",
  "OTHER",
] as const;

export const commercialInvoiceLineSchema = z.object({
  description: z.string().trim().min(2).max(200),
  quantity: z.number().positive().max(100_000),
  unit: z.string().trim().min(1).max(20).default("PCS"),
  unitValue: z.number().nonnegative().max(10_000_000),
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
