import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CLAUDE_MODEL, claudeClient } from "@/lib/ai/claude";

const Suggestion = z.object({
  dutyPercent: z.number().describe("Typical import duty % for general consumer goods (clothing, handicrafts, tea)"),
  taxPercent: z.number().describe("Standard import VAT / GST / sales tax %"),
  dutyFreeUnderUsd: z.number().describe("Goods value in USD below which no duty is charged; 0 if none"),
  taxFreeUnderUsd: z.number().describe("Goods value in USD below which no import tax is charged; 0 if none"),
  includeFreight: z.boolean().describe("true if customs value includes freight and insurance (CIF), false if goods only (FOB)"),
  ddpFeeUsd: z.number().describe("Typical express-carrier fee in USD for paying duties on the sender's behalf"),
  explanation: z.string().describe("Two or three plain sentences: the rules used, recent changes, and anything to double-check"),
});

export type DutySuggestion = z.infer<typeof Suggestion>;

/** Asks Claude for typical import rules for parcels from Nepal to a country. Staff review before saving. */
export async function suggestDutyRule(countryCode: string, countryName: string): Promise<DutySuggestion | { error: string }> {
  const client = claudeClient();
  if (!client) return { error: "AI is not switched on." };
  try {
    const response = await client.beta.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Suggestion) },
      system: "You advise a Kathmandu courier on destination import duties for small express parcels (gifts, clothing, handicrafts, tea) from Nepal. Give realistic typical figures, convert thresholds to USD, and mention any recent rule changes you know of and the date they took effect. Say clearly when a figure should be checked with the carrier.",
      messages: [{ role: "user", content: `Destination: ${countryName} (${countryCode}).` }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return { error: "The AI could not suggest rules for this country." };
    return response.parsed_output;
  } catch (error) {
    console.error("[duty-suggest.ts:suggestDutyRule]", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error instanceof Error ? error.message : error);
    return { error: "The AI suggestion failed. Enter the figures by hand." };
  }
}
