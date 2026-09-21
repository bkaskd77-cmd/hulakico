import type { QuoteOptionView } from "@/lib/data/quotes";

export type RankedQuoteOption = QuoteOptionView & {
  rankScore: number;
  rankReason: string;
  rank: number;
};

export type EtaRiskResult = {
  level: "LOW" | "MEDIUM" | "HIGH";
  score: number;
  factors: string[];
};

export type DocQcResult = {
  severity: "OK" | "WARN" | "BLOCKER";
  passed: boolean;
  warnings: Array<{ code: string; message: string }>;
};

async function intelligenceFetch<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = process.env.INTELLIGENCE_API_URL;
  const token = process.env.INTELLIGENCE_SERVICE_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("Intelligence service env is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Intelligence ${path} failed: ${response.status} ${text}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function rankQuoteOptions(input: {
  options: QuoteOptionView[];
  wantsCod: boolean;
}): Promise<RankedQuoteOption[]> {
  try {
    const data = await intelligenceFetch<{ options: RankedQuoteOption[] }>(
      "/v1/rank-quotes",
      input,
    );
    return data.options ?? [];
  } catch (error) {
    console.error(
      "[intelligence-client.ts:rankQuoteOptions]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not rank quotes via intelligence service.");
  }
}

export async function assessEtaRisk(input: {
  lane: string;
  destinationCity: string;
  serviceClass: string;
}): Promise<EtaRiskResult> {
  try {
    return await intelligenceFetch<EtaRiskResult>("/v1/eta-risk", input);
  } catch (error) {
    console.error(
      "[intelligence-client.ts:assessEtaRisk]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not assess ETA risk.");
  }
}

export async function runDocumentQc(input: {
  lane: string;
  packageType: string;
  contents: string;
  declaredValue: number | null;
  currency: string;
  originAddress: string;
  destinationAddress: string;
  originCountry: string;
  destinationCountry: string;
}): Promise<DocQcResult> {
  try {
    return await intelligenceFetch<DocQcResult>("/v1/document-qc", input);
  } catch (error) {
    console.error(
      "[intelligence-client.ts:runDocumentQc]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not run document QC.");
  }
}

export type PlaceSuggestion = {
  label: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  country: string;
};

export async function suggestPlaces(input: {
  query: string;
  countryHint?: string;
}): Promise<PlaceSuggestion[]> {
  try {
    const data = await intelligenceFetch<{ places: PlaceSuggestion[] }>(
      "/v1/suggest-places",
      input,
    );
    return data.places ?? [];
  } catch (error) {
    console.error(
      "[intelligence-client.ts:suggestPlaces]",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
