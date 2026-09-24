import type { EtaRiskResult } from "@/lib/data/intelligence-client";

export type EtaRiskBatchItem = {
  id: string;
  lane: string;
  destinationCity: string;
  serviceClass: string;
};

export type EtaRiskBatchResult = EtaRiskResult & { id: string };

async function intelligencePost<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = process.env.INTELLIGENCE_API_URL;
  const token = process.env.INTELLIGENCE_SERVICE_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("Intelligence service env is not configured.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
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

/** Batch ETA risk for Admin tower (caps at 40 on the service). */
export async function assessEtaRiskBatch(
  items: EtaRiskBatchItem[],
): Promise<EtaRiskBatchResult[]> {
  try {
    if (items.length === 0) return [];
    const data = await intelligencePost<{ results: EtaRiskBatchResult[] }>(
      "/v1/eta-risk-batch",
      { items: items.slice(0, 40) },
    );
    return data.results ?? [];
  } catch (error) {
    console.error(
      "[intelligence-batch.ts:assessEtaRiskBatch]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not batch-assess ETA risk.");
  }
}
