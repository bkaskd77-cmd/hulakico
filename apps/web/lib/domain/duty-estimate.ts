import { z } from "zod";

/** One destination's import rules, all money in USD. Admin keeps these up to date. */
export const dutyRuleSchema = z.object({
  dutyPercent: z.number().min(0).max(300),
  taxPercent: z.number().min(0).max(100),
  dutyFreeUnderUsd: z.number().min(0).max(1_000_000),
  taxFreeUnderUsd: z.number().min(0).max(1_000_000),
  /** EU/UK style: duty on goods + freight + insurance (CIF). US style: goods only (FOB). */
  includeFreight: z.boolean(),
  ddpFeeUsd: z.number().min(0).max(10_000),
  updatedAt: z.string().optional(),
});

export const dutySettingsSchema = z.object({
  usdToNpr: z.number().positive().max(10_000),
  rules: z.record(z.string().regex(/^[A-Z]{2}$/), dutyRuleSchema),
});

export type DutyRule = z.infer<typeof dutyRuleSchema>;
export type DutySettings = z.infer<typeof dutySettingsSchema>;

export type DutyEstimate = {
  duty: number;
  tax: number;
  fee: number;
  total: number;
  currency: string;
};

const round = (value: number) => Math.round(value * 100) / 100;

/** Converts between NPR and USD with the Admin exchange rate; other currencies are not used. */
function toUsd(amount: number, currency: string, usdToNpr: number): number {
  return currency === "NPR" ? amount / usdToNpr : amount;
}

function fromUsd(amountUsd: number, currency: string, usdToNpr: number): number {
  return currency === "NPR" ? amountUsd * usdToNpr : amountUsd;
}

/**
 * Estimated destination duties and taxes for a DDP shipment, in the booking currency.
 * duty = customs value × duty % (above the duty-free threshold);
 * tax = (customs value + duty) × VAT/GST % (above the tax-free threshold);
 * plus the carrier's DDP handling fee. Thresholds compare against the goods value.
 */
export function estimateDuties(input: {
  goodsValue: number;
  freight: number;
  insurance: number;
  invoiceCurrency: string;
  chargeCurrency: string;
  rule: DutyRule;
  usdToNpr: number;
}): DutyEstimate {
  const { rule, usdToNpr } = input;
  const goodsUsd = toUsd(input.goodsValue, input.invoiceCurrency, usdToNpr);
  const extrasUsd = rule.includeFreight ? toUsd(input.freight + input.insurance, input.invoiceCurrency, usdToNpr) : 0;
  const customsUsd = goodsUsd + extrasUsd;
  const dutyUsd = goodsUsd > rule.dutyFreeUnderUsd ? customsUsd * (rule.dutyPercent / 100) : 0;
  const taxUsd = goodsUsd > rule.taxFreeUnderUsd ? (customsUsd + dutyUsd) * (rule.taxPercent / 100) : 0;
  const convert = (usd: number) => round(fromUsd(usd, input.chargeCurrency, usdToNpr));
  const duty = convert(dutyUsd);
  const tax = convert(taxUsd);
  const fee = convert(rule.ddpFeeUsd);
  return { duty, tax, fee, total: round(duty + tax + fee), currency: input.chargeCurrency };
}
