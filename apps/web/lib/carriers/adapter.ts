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
      return [
        {
          status: "BOOKED",
          description: `Stub acceptance for ${externalAwb}`,
          occurredAt: new Date().toISOString(),
          location: "Kathmandu",
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
};

export function getCarrierAdapter(adapterKey: string): CarrierAdapter {
  const adapter = adapters[adapterKey];
  if (!adapter) {
    throw new Error(`Unknown carrier adapter: ${adapterKey}`);
  }
  return adapter;
}

export function listAdapterKeys(): string[] {
  return Object.keys(adapters);
}
