import { dutySettingsSchema, type DutySettings } from "@/lib/domain/duty-estimate";
import { readSiteContent, writeSiteContent } from "@/lib/data/site-content-store";

const SLUG = "duty-rules";
/** Used until Admin sets the rate; shown on the Admin page so it is never silently wrong. */
export const DEFAULT_USD_TO_NPR = 135;

/** DDP duty rules per destination country and the USD → NPR rate. Empty rules until Admin adds them. */
export async function getDutySettings(): Promise<DutySettings> {
  try {
    const row = await readSiteContent(SLUG);
    if (!row) return { usdToNpr: DEFAULT_USD_TO_NPR, rules: {} };
    const parsed = dutySettingsSchema.safeParse(JSON.parse(row.content_json));
    if (parsed.success) return parsed.data;
    console.error("[duty-settings.ts:getDutySettings] stored rules are invalid; using none");
    return { usdToNpr: DEFAULT_USD_TO_NPR, rules: {} };
  } catch (error) {
    console.error("[duty-settings.ts:getDutySettings]", error instanceof Error ? error.message : error);
    return { usdToNpr: DEFAULT_USD_TO_NPR, rules: {} };
  }
}

/** Admin: replace the whole duty table after validation. */
export async function saveDutySettings(input: unknown): Promise<{ ok: true; settings: DutySettings } | { error: string }> {
  try {
    const parsed = dutySettingsSchema.safeParse(input);
    if (!parsed.success) return { error: "Check the numbers: percentages 0–300, thresholds and fees 0 or more, exchange rate above 0." };
    const now = new Date().toISOString();
    const settings: DutySettings = {
      usdToNpr: parsed.data.usdToNpr,
      rules: Object.fromEntries(Object.entries(parsed.data.rules).map(([country, rule]) => [country, { ...rule, updatedAt: rule.updatedAt ?? now }])),
    };
    await writeSiteContent(SLUG, JSON.stringify(settings));
    return { ok: true, settings };
  } catch (error) {
    console.error("[duty-settings.ts:saveDutySettings]", error instanceof Error ? error.message : error);
    return { error: "Could not save the duty table." };
  }
}
