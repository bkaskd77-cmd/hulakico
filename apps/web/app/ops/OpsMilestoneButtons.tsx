"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Route = { lane: string; originCity: string; destinationCity: string; destinationCountry: string; lastLocation: string | null };

const STEPS = [
  { status: "BOOKED", label: "Booked" },
  { status: "HANDOVER_PENDING", label: "Handed over" },
  { status: "IN_TRANSIT", label: "In transit" },
  { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { status: "DELIVERED", label: "Delivered" },
] as const;

const RANK: Record<string, number> = { BOOKED: 0, HANDOVER_PENDING: 1, IN_TRANSIT: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 4, EXCEPTION: 0 };

/** One-tap notes per step; Ops can also type their own. */
const NOTES: Record<string, string[]> = {
  HANDOVER_PENDING: ["Picked up by the courier", "Dropped at the Hulakico desk"],
  IN_TRANSIT: ["Departed", "Arrived at hub", "In customs clearance", "Customs cleared", "Delayed, waiting for the next flight"],
  OUT_FOR_DELIVERY: ["Out for delivery"],
  DELIVERED: ["Delivered", "Delivered, signed by the receiver"],
};

// Common transit hubs for Nepal shipments; staff can still type any place.
const HUBS = ["Kathmandu airport (TIA)", "Delhi hub", "Kolkata hub", "Doha hub", "Dubai hub", "Leipzig hub", "Cincinnati hub", "Hong Kong hub"];

function defaultPlace(status: string, route: Route | null): string {
  if (!route) return "";
  if (status === "HANDOVER_PENDING") return route.originCity;
  if (status === "IN_TRANSIT") return route.lastLocation || route.originCity;
  return route.destinationCity;
}

/** Ops tracking update: pick the step, confirm where it happened, add an optional note, post. */
export function OpsMilestoneButtons({ shipmentId, currentStatus, onError }: { shipmentId: string; currentStatus: string; onError: (message: string | null) => void }) {
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const currentRank = RANK[currentStatus] ?? 0;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ops/shipments/${shipmentId}/milestone`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (!cancelled && data) setRoute(data as Route); })
      .catch((error) => console.error("[OpsMilestoneButtons.tsx:route]", error));
    return () => { cancelled = true; };
  }, [shipmentId, currentStatus]);

  function choose(status: string) {
    onError(null);
    setStep(status);
    setPlace(defaultPlace(status, route));
    setNote("");
  }

  async function post() {
    if (!step) return;
    onError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/ops/shipments/${shipmentId}/milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: step, location: place, note }),
      });
      const data = await response.json();
      if (!response.ok) return onError(data.error || "Could not update Hulakico status.");
      setStep(null);
      router.refresh();
    } catch (err) {
      console.error("[OpsMilestoneButtons.tsx:post]", err);
      onError("Could not update Hulakico status.");
    } finally {
      setPending(false);
    }
  }

  const places = [...new Set([route?.lastLocation, route?.originCity, route?.destinationCity, ...(route?.lane === "INTERNATIONAL" ? HUBS : [])].filter(Boolean))] as string[];
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--off-white)]">Now: {currentStatus.replaceAll("_", " ").toLowerCase()}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {STEPS.map((item) => {
          const rank = RANK[item.status] ?? 0;
          // In transit can be posted again for every hub the parcel passes.
          const canPick = item.status !== "BOOKED" && (rank > currentRank || (item.status === "IN_TRANSIT" && currentStatus === "IN_TRANSIT"));
          const isCurrent = currentStatus === item.status;
          const isChosen = step === item.status;
          return (
            <button key={item.status} type="button" aria-pressed={isChosen} disabled={!canPick || pending} onClick={() => choose(item.status)}
              className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                isChosen ? "border-[#f6f1e7] bg-[#f6f1e7] text-[#0e3d38]"
                  : isCurrent ? "border-[var(--teal)] text-[var(--off-white)] ring-1 ring-[var(--teal)]"
                  : rank < currentRank ? "border-[var(--teal)] bg-[color-mix(in_srgb,var(--teal)_28%,transparent)] text-[var(--off-white)]"
                  : canPick ? "border-[color-mix(in_srgb,var(--off-white)_40%,transparent)] text-[var(--off-white)] hover:border-[#f6f1e7]"
                  : "border-[color-mix(in_srgb,var(--off-white)_16%,transparent)] text-[var(--off-white)] opacity-60"}`}>
              {isCurrent ? "● " : ""}{item.label}{item.status === "IN_TRANSIT" && currentStatus === "IN_TRANSIT" ? " (add stop)" : ""}
            </button>
          );
        })}
      </div>
      {step ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-xs text-[var(--muted)]">Where
            <input list={`places-${shipmentId}`} value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City, hub, or airport"
              className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[var(--navy)] px-2.5 py-1.5 text-sm text-[var(--off-white)]" />
            <datalist id={`places-${shipmentId}`}>{places.map((p) => <option key={p} value={p} />)}</datalist>
          </label>
          <label className="text-xs text-[var(--muted)]">Note for the customer (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder={NOTES[step]?.[0]}
              className="mt-1 w-full rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[var(--navy)] px-2.5 py-1.5 text-sm text-[var(--off-white)]" />
          </label>
          <button type="button" onClick={post} disabled={pending} className="rounded-md bg-[#ffcc00] px-3 py-1.5 text-xs font-semibold text-[#191919] disabled:opacity-60">{pending ? "Posting…" : "Post update"}</button>
          <div className="flex flex-wrap gap-1.5 sm:col-span-3">
            {(NOTES[step] ?? []).map((preset) => (
              <button key={preset} type="button" onClick={() => setNote(preset)} className="rounded border border-[color-mix(in_srgb,var(--teal)_45%,transparent)] px-2 py-0.5 text-[10px] text-[var(--teal)]">{preset}</button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
