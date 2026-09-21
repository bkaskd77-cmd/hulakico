"use client";

import { PartyAddressBlock } from "./PartyAddressBlock";
import type { FormState, FormUpdate } from "./form-types";

export function RouteFields({
  form,
  update,
  field,
  lane,
}: {
  form: FormState;
  update: FormUpdate;
  field: string;
  lane: string;
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
      />
      <PartyAddressBlock
        title="To (consignee)"
        side="destination"
        form={form}
        update={update}
        field={field}
        lane={lane}
      />
    </div>
  );
}
