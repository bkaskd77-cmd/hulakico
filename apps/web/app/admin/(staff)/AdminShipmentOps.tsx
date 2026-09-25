"use client";

import { useState } from "react";
import Link from "next/link";
import { AttachPartnerAwbForm } from "@/app/ops/AttachPartnerAwbForm";
import { OpenExceptionForm } from "@/app/ops/OpenExceptionForm";

const OPS_TRACK = new Set([
  "BOOKED",
  "HANDOVER_PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
]);

/** Terminal statuses — no new exceptions; journey is finished. */
const FINISHED = new Set(["DELIVERED", "CANCELLED", "RTO"]);

/** View/Manage for list; on detail pass startOpen + hideView. */
export function AdminShipmentOps({
  shipmentId,
  status,
  openExceptionId,
  externalAwb,
  partnerLabel,
  startOpen = false,
  hideView = false,
}: {
  shipmentId: string;
  status: string;
  openExceptionId: string | null;
  externalAwb: string | null;
  partnerLabel: string | null;
  startOpen?: boolean;
  hideView?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const canTrack = OPS_TRACK.has(status);
  const finished = FINISHED.has(status);
  const canFlag =
    !finished && status !== "EXCEPTION" && !openExceptionId;
  const viewHref = `/admin/shipments/${shipmentId}`;

  if (!open) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {openExceptionId ? (
          <span className="rounded bg-[var(--danger)] px-2 py-1 text-xs text-[var(--off-white)]">
            Exception open
          </span>
        ) : null}
        {!hideView ? (
          <Link
            href={viewHref}
            className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)] transition hover:brightness-110"
          >
            View
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-[var(--teal)] px-3 py-1.5 text-xs font-semibold text-[var(--teal)] transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
        >
          Manage
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {!hideView ? (
            <Link
              href={viewHref}
              className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--navy)]"
            >
              View
            </Link>
          ) : null}
          {openExceptionId ? (
            <span className="rounded bg-[var(--danger)] px-2 py-1 text-xs text-[var(--off-white)]">
              Exception open
            </span>
          ) : null}
          {canFlag ? <OpenExceptionForm shipmentId={shipmentId} /> : null}
          {finished ? (
            <span className="text-xs text-[var(--muted)]">
              Finished — exception flagging closed
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-[var(--muted)] underline-offset-2 hover:underline"
        >
          Close
        </button>
      </div>
      {canTrack ? (
        <AttachPartnerAwbForm
          shipmentId={shipmentId}
          currentAwb={externalAwb}
          currentPartnerLabel={partnerLabel}
          currentStatus={status}
        />
      ) : null}
    </div>
  );
}
