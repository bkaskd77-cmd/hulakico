import type { QuoteOptionView } from "@/lib/data/quotes";

export type RankedQuoteOption = QuoteOptionView & {
  rankScore: number;
  rankReason: string;
  rank: number;
};

export async function rankQuoteOptions(input: {
  options: QuoteOptionView[];
  wantsCod: boolean;
}): Promise<RankedQuoteOption[]> {
  try {
    const baseUrl = process.env.INTELLIGENCE_API_URL;
    const token = process.env.INTELLIGENCE_SERVICE_TOKEN;
    if (!baseUrl || !token) {
      throw new Error("Intelligence service env is not configured.");
    }

    const response = await fetch(`${baseUrl}/v1/rank-quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        options: input.options,
        wantsCod: input.wantsCod,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Intelligence rank failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as { options: RankedQuoteOption[] };
    return data.options ?? [];
  } catch (error) {
    console.error(
      "[intelligence-client.ts:rankQuoteOptions]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not rank quotes via intelligence service.");
  }
}
