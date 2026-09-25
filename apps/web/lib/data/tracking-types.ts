export type TrackEvent = {
  id: string;
  status: string;
  description: string;
  location: string | null;
  occurredAt: string;
};

export type PublicTrackingView = {
  hulakicoAwb: string;
  externalAwb: string | null;
  status: string;
  statusNote: string;
  originCity: string;
  destinationCity: string;
  lane: string;
  carrierName: string | null;
  partnerLabel: string | null;
  partnerTrackUrl: string | null;
  trackingToken: string;
  holdInfo: { reason: string; contactHint: string } | null;
  infoRequest: { note: string; customerReply: string | null } | null;
  events: TrackEvent[];
};
