export type TransportMode = "THIRD_PARTY" | "OWN_FLEET";
export type CarrierScope = "DOMESTIC" | "INTERNATIONAL" | "BOTH";
export type ServiceClass = "EXPRESS" | "ECONOMY" | "FREIGHT_ASSIST";

export type TrackingEventInput = {
  status: string;
  description: string;
  occurredAt: string;
  location?: string;
};

export type CreateShipmentInput = {
  originCountry: string;
  destinationCountry: string;
  weightKg: number;
  serviceCode: string;
};

export type CreateShipmentResult = {
  externalAwb: string;
  message: string;
};

export interface CarrierAdapter {
  readonly key: string;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  getTracking(externalAwb: string): Promise<TrackingEventInput[]>;
}

export type CarrierRecord = {
  id: string;
  code: string;
  name: string;
  transportMode: TransportMode;
  scope: CarrierScope;
  isActive: boolean;
  adapterKey: string;
};

export type CarrierServiceRecord = {
  id: string;
  carrierId: string;
  code: string;
  name: string;
  serviceClass: ServiceClass;
  etaDaysMin: number;
  etaDaysMax: number;
  supportsCod: boolean;
};

export type RateCardRecord = {
  id: string;
  carrierServiceId: string;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
  zoneLabel: string;
};
