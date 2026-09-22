import { DhlAdapter } from "@/lib/carriers/dhl";
import { createEnvPartnerAdapter } from "@/lib/carriers/live-partner";
import type {
  CarrierAdapter,
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingEventInput,
} from "@/lib/domain/carrier-types";

class StubCarrierAdapter implements CarrierAdapter {
  constructor(readonly key: string) {}

  async createShipment(
    input: CreateShipmentInput,
  ): Promise<CreateShipmentResult> {
    try {
      const stamp = Date.now().toString(36).toUpperCase();
      return {
        externalAwb: `${this.key.toUpperCase()}-${stamp}`,
        message: `Stub booking via ${this.key} (${input.serviceCode}, ${input.weightKg}kg).`,
      };
    } catch (error) {
      console.error(
        "[adapter.ts:createShipment]",
        error instanceof Error ? error.message : error,
      );
      throw new Error("Stub carrier booking failed.");
    }
  }

  async getTracking(externalAwb: string): Promise<TrackingEventInput[]> {
    try {
      const now = Date.now();
      return [
        {
          status: "BOOKED",
          description: `Stub acceptance for ${externalAwb}`,
          occurredAt: new Date(now - 3 * 3600_000).toISOString(),
          location: "Kathmandu",
        },
        {
          status: "IN_TRANSIT",
          description: `Stub transit scan for ${externalAwb}`,
          occurredAt: new Date(now - 3600_000).toISOString(),
          location: "In network",
        },
        {
          status: "OUT_FOR_DELIVERY",
          description: `Stub out for delivery for ${externalAwb}`,
          occurredAt: new Date(now).toISOString(),
          location: "Destination hub",
        },
      ];
    } catch (error) {
      console.error(
        "[adapter.ts:getTracking]",
        error instanceof Error ? error.message : error,
      );
      throw new Error("Stub tracking failed.");
    }
  }
}

const adapters: Record<string, CarrierAdapter> = {
  stub_domestic: new StubCarrierAdapter("stub_domestic"),
  stub_dhl: new StubCarrierAdapter("stub_dhl"),
  stub_fedex: new StubCarrierAdapter("stub_fedex"),
  stub_own_fleet: new StubCarrierAdapter("stub_own_fleet"),
  dhl: new DhlAdapter(),
  fedex: createEnvPartnerAdapter({
    key: "fedex",
    apiKeyEnv: "FEDEX_API_KEY",
    modeEnv: "FEDEX_ADAPTER_MODE",
    baseUrlEnv: "FEDEX_API_BASE_URL",
    awbPrefix: "FDX",
    label: "FedEx",
  }),
  domestic_courier: createEnvPartnerAdapter({
    key: "domestic_courier",
    apiKeyEnv: "DOMESTIC_COURIER_API_KEY",
    modeEnv: "DOMESTIC_COURIER_ADAPTER_MODE",
    baseUrlEnv: "DOMESTIC_COURIER_API_BASE_URL",
    awbPrefix: "NPC",
    label: "Domestic courier",
  }),
};

/** Promote stub_* keys to live adapters when matching API keys are present. */
function resolveAdapterKey(adapterKey: string): string {
  if (adapterKey === "stub_dhl" && process.env.DHL_API_KEY?.trim()) return "dhl";
  if (adapterKey === "stub_fedex" && process.env.FEDEX_API_KEY?.trim()) return "fedex";
  if (adapterKey === "stub_domestic" && process.env.DOMESTIC_COURIER_API_KEY?.trim()) {
    return "domestic_courier";
  }
  return adapterKey;
}

export function getCarrierAdapter(adapterKey: string): CarrierAdapter {
  const key = resolveAdapterKey(adapterKey);
  const adapter = adapters[key];
  if (!adapter) {
    throw new Error(`Unknown carrier adapter: ${adapterKey}`);
  }
  return adapter;
}

export function listAdapterKeys(): string[] {
  return Object.keys(adapters);
}
