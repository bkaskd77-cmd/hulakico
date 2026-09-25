import type {
  CarrierAdapter,
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingEventInput,
} from "@/lib/domain/carrier-types";

function dhlMode(): "sandbox" | "live" {
  const mode = (process.env.DHL_ADAPTER_MODE || "sandbox").trim().toLowerCase();
  return mode === "live" ? "live" : "sandbox";
}

function requireDhlApiKey(): string {
  const key = process.env.DHL_API_KEY?.trim();
  if (!key) {
    throw new Error("DHL_API_KEY is not configured. Keep using stub_dhl or set credentials.");
  }
  return key;
}

const LIVE_FETCH_MS = 8000;

async function fetchLive(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LIVE_FETCH_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/** Live/sandbox DHL adapter — credentials required; sandbox avoids real network. */
export class DhlAdapter implements CarrierAdapter {
  readonly key = "dhl";

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    try {
      const apiKey = requireDhlApiKey();
      if (dhlMode() === "live") {
        return await this.createLive(apiKey, input);
      }
      const stamp = Date.now().toString().slice(-10);
      return {
        externalAwb: `DHL${stamp}`,
        message: `DHL sandbox booking (${input.serviceCode}, ${input.weightKg}kg).`,
      };
    } catch (error) {
      console.error(
        "[dhl.ts:createShipment]",
        error instanceof Error ? error.message : error,
      );
      throw error instanceof Error ? error : new Error("DHL booking failed.");
    }
  }

  async getTracking(externalAwb: string): Promise<TrackingEventInput[]> {
    try {
      const apiKey = requireDhlApiKey();
      if (dhlMode() === "live") {
        return await this.trackLive(apiKey, externalAwb);
      }
      const now = Date.now();
      return [
        {
          status: "BOOKED",
          description: `DHL sandbox accepted ${externalAwb}`,
          occurredAt: new Date(now - 6 * 3600_000).toISOString(),
          location: "Origin facility",
        },
        {
          status: "IN_TRANSIT",
          description: `DHL sandbox transit ${externalAwb}`,
          occurredAt: new Date(now - 2 * 3600_000).toISOString(),
          location: "Sort hub",
        },
        {
          status: "OUT_FOR_DELIVERY",
          description: `DHL sandbox out for delivery ${externalAwb}`,
          occurredAt: new Date(now).toISOString(),
          location: "Destination city",
        },
      ];
    } catch (error) {
      console.error(
        "[dhl.ts:getTracking]",
        error instanceof Error ? error.message : error,
      );
      throw error instanceof Error ? error : new Error("DHL tracking failed.");
    }
  }

  private async createLive(
    apiKey: string,
    input: CreateShipmentInput,
  ): Promise<CreateShipmentResult> {
    const base = (process.env.DHL_API_BASE_URL || "").replace(/\/$/, "");
    if (!base) throw new Error("DHL_API_BASE_URL is required for live mode.");
    const response = await fetchLive(`${base}/shipments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originCountry: input.originCountry,
        destinationCountry: input.destinationCountry,
        weightKg: input.weightKg,
        serviceCode: input.serviceCode,
      }),
    });
    const data = (await response.json()) as {
      externalAwb?: string;
      message?: string;
      error?: string;
    };
    if (!response.ok || !data.externalAwb) {
      throw new Error(data.error || "DHL live createShipment failed.");
    }
    return {
      externalAwb: data.externalAwb,
      message: data.message || "DHL live booking created.",
    };
  }

  private async trackLive(
    apiKey: string,
    externalAwb: string,
  ): Promise<TrackingEventInput[]> {
    const base = (process.env.DHL_API_BASE_URL || "").replace(/\/$/, "");
    if (!base) throw new Error("DHL_API_BASE_URL is required for live mode.");
    const response = await fetchLive(
      `${base}/tracking/${encodeURIComponent(externalAwb)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    const data = (await response.json()) as {
      events?: TrackingEventInput[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error || "DHL live tracking failed.");
    }
    return data.events ?? [];
  }
}
