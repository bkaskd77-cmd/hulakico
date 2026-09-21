"use client";

import type { SavedAddress } from "@/lib/data/addresses";
import type { PlaceSuggestion } from "@/lib/data/intelligence-client";
import { PartyAddressBlock } from "./PartyAddressBlock";
import type { FormState, FormUpdate } from "./form-types";

export function RouteFields({
  form,
  update,
  field,
  lane,
  addresses,
  onPickOrigin,
  onPickDestination,
  onSaved,
  onPlaceOrigin,
  onPlaceDestination,
}: {
  form: FormState;
  update: FormUpdate;
  field: string;
  lane: string;
  addresses: SavedAddress[];
  onPickOrigin: (address: SavedAddress) => void;
  onPickDestination: (address: SavedAddress) => void;
  onSaved: (address: SavedAddress) => void;
  onPlaceOrigin: (place: PlaceSuggestion) => void;
  onPlaceDestination: (place: PlaceSuggestion) => void;
}) {
  return (
    <div className="mt-6 space-y-8">
      <PartyAddressBlock
        title="From (shipper)"
        side="origin"
        form={form}
        update={update}
        field={field}
        lane={lane}
        addresses={addresses}
        onPick={onPickOrigin}
        onSaved={onSaved}
        onPlacePick={onPlaceOrigin}
      />
      <PartyAddressBlock
        title="To (consignee)"
        side="destination"
        form={form}
        update={update}
        field={field}
        lane={lane}
        addresses={addresses}
        onPick={onPickDestination}
        onSaved={onSaved}
        onPlacePick={onPlaceDestination}
      />
    </div>
  );
}
