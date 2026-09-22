import type {
  CarrierAdapter,
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingEventInput,
} from "@/lib/domain/carrier-types";

type PartnerEnv = {
  key: string;
  apiKeyEnv: string;
  modeEnv: string;
  baseUrlEnv: string;
  awbPrefix: string;
  label: string;
};

function requireKey(envName: string, label: string): string {
  const key = process.env[envName]?.trim();
  if (!key) {
    throw new Error(`${envName} is not configured for ${label}.`);
  }
  return key;
}

function modeOf(envName: string): "sandbox" | "live" {
  return (process.env[envName] || "sandbox").trim().toLowerCase() === "live"
    ? "live"
    : "sandbox";
}

/** Shared sandbox/live HTTP partner adapter factory (FedEx, domestic, etc.). */
export function createEnvPartnerAdapter(env: PartnerEnv): CarrierAdapter {
  return {
    key: env.key,
    async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
      try {
        const apiKey = requireKey(env.apiKeyEnv, env.label);
        if (modeOf(env.modeEnv) === "live") {
          const base = (process.env[env.baseUrlEnv] || "").replace(/\/$/, "");
          if (!base) throw new Error(`${env.baseUrlEnv} required for live mode.`);
          const response = await fetch(`${base}/shipments`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(input),
          });
          const data = (await response.json()) as {
            externalAwb?: string;
            message?: string;
            error?: string;
          };
          if (!response.ok || !data.externalAwb) {
            throw new Error(data.error || `${env.label} live booking failed.`);
          }
          return {
            externalAwb: data.externalAwb,
            message: data.message || `${env.label} live booking created.`,
          };
        }
        const stamp = Date.now().toString().slice(-10);
        return {
          externalAwb: `${env.awbPrefix}${stamp}`,
          message: `${env.label} sandbox booking (${input.serviceCode}).`,
        };
      } catch (error) {
        console.error(
          `[live-partner.ts:${env.key}:createShipment]`,
          error instanceof Error ? error.message : error,
        );
        throw error instanceof Error ? error : new Error(`${env.label} booking failed.`);
      }
    },
    async getTracking(externalAwb: string): Promise<TrackingEventInput[]> {
      try {
        const apiKey = requireKey(env.apiKeyEnv, env.label);
        if (modeOf(env.modeEnv) === "live") {
          const base = (process.env[env.baseUrlEnv] || "").replace(/\/$/, "");
          if (!base) throw new Error(`${env.baseUrlEnv} required for live mode.`);
          const response = await fetch(
            `${base}/tracking/${encodeURIComponent(externalAwb)}`,
            { headers: { Authorization: `Bearer ${apiKey}` } },
          );
          const data = (await response.json()) as {
            events?: TrackingEventInput[];
            error?: string;
          };
          if (!response.ok) {
            throw new Error(data.error || `${env.label} live tracking failed.`);
          }
          return data.events ?? [];
        }
        const now = Date.now();
        return [
          {
            status: "BOOKED",
            description: `${env.label} sandbox accepted ${externalAwb}`,
            occurredAt: new Date(now - 5 * 3600_000).toISOString(),
            location: "Origin",
          },
          {
            status: "IN_TRANSIT",
            description: `${env.label} sandbox transit ${externalAwb}`,
            occurredAt: new Date(now).toISOString(),
            location: "Network",
          },
        ];
      } catch (error) {
        console.error(
          `[live-partner.ts:${env.key}:getTracking]`,
          error instanceof Error ? error.message : error,
        );
        throw error instanceof Error ? error : new Error(`${env.label} tracking failed.`);
      }
    },
  };
}
