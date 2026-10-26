import { getDeliveryProof } from "@/lib/data/delivery-proof";
import { nepalTime } from "@/lib/domain/shipment-labels";

/** Signed-in owner or staff: who received the parcel, and the delivery photo when there is one. */
export async function DeliveryProofPanel({ shipmentId }: { shipmentId: string }) {
  const proof = await getDeliveryProof(shipmentId);
  if (!proof) return null;
  return (
    <section className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Proof of delivery</p>
      <p className="mt-1 font-semibold">Received by {proof.receivedBy}</p>
      <p className="text-xs text-slate-600">Recorded {nepalTime(proof.recordedAt)}</p>
      {proof.photoKind ? (
        <a href={`/api/shipments/${shipmentId}/delivery-photo`} target="_blank" rel="noopener" className="mt-3 block w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- private photo served by an authenticated route */}
          <img src={`/api/shipments/${shipmentId}/delivery-photo`} alt={`Delivery photo, received by ${proof.receivedBy}`} className="max-h-56 rounded-md border border-emerald-200" />
        </a>
      ) : null}
    </section>
  );
}
