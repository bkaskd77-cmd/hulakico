import type { EtaRiskResult } from "@/lib/data/intelligence-client";

export type EtaRiskBatchItem = {
  id: string;
  lane: string;
  destinationCity: string;
  serviceClass: string;
};

export type EtaRiskBatchResult = EtaRiskResult & { id: string };

/** Skip remote calls briefly after a failure (fail fast while Python is down). */
let circuitOpenUntil = 0;
const FETCH_MS = 1200;
const CIRCUIT_MS = 30_000;

async function intelligencePost<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = process.env.INTELLIGENCE_API_URL;
  const token = process.env.INTELLIGENCE_SERVICE_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("Intelligence service env is not configured.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_MS);
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
    if (Date.now() < circuitOpenUntil) return [];
    const data = await intelligencePost<{ results: EtaRiskBatchResult[] }>(
      "/v1/eta-risk-batch",
      { items: items.slice(0, 40) },
    );
    return data.results ?? [];
  } catch (error) {
    circuitOpenUntil = Date.now() + CIRCUIT_MS;
    console.warn(
      "[intelligence-batch.ts:assessEtaRiskBatch] offline fallback",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
