import Link from "next/link";
import { copyShipmentAction } from "@/app/account/copy-actions";
import type { MyShipmentRow } from "@/lib/data/my-shipments";

function statusEdge(status: string): string {
  if (status === "EXCEPTION") return "bg-[var(--danger)]";
  if (status === "DELIVERED") return "bg-emerald-500";
  if (status === "IN_TRANSIT" || status === "OUT_FOR_DELIVERY") return "bg-[var(--gold)]";
    if (status === "BOOKED" || status === "HANDOVER_PENDING") return "bg-[var(--teal-fill)]";
  if (status === "CANCELLED" || status === "RTO") return "bg-slate-400";
  return "bg-sky-500";
}

function trackOrDraftHref(row: MyShipmentRow): string {
  if (row.status === "DRAFT" || row.status === "QUOTED") return `/book/draft/${row.id}`;
  if (row.trackingToken) return `/track/${row.trackingToken}`;
  return `/book/draft/${row.id}`;
}

/** Rich customer hub card — status edge, From/To, AWB, actions. */
export function ShipmentListCard({ row }: { row: MyShipmentRow }) {
  const isDraft = row.status === "DRAFT" || row.status === "QUOTED";
  const contents =
    row.contents.length > 48 ? `${row.contents.slice(0, 48)}…` : row.contents;

  return (
    <li className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex">
        <div aria-hidden className={`w-1.5 shrink-0 ${statusEdge(row.status)}`} />
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
                {row.hulakicoAwb ?? "Draft shipment"}
              </p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--teal-ink)]">
                {row.status.replaceAll("_", " ")}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Updated {new Date(row.updatedAt).toLocaleString()}
            </p>
          </div>

          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ship from</p>
              <p className="mt-1 font-semibold text-slate-900">
                {row.originContactName || row.originCity}
              </p>
              <p className="text-slate-600">
                {row.originCity}, {row.originCountry}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ship to</p>
              <p className="mt-1 font-semibold text-slate-900">
                {row.destinationContactName || row.destinationCity}
              </p>
              <p className="text-slate-600">
                {row.destinationCity}, {row.destinationCountry}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-600">
            {row.lane} · {row.serviceClass} · {row.packageType}
            {contents ? ` · ${contents}` : ""} · {row.settleShort}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs font-semibold">
            <Link href={`/account/shipments/${row.id}`} className="text-slate-900 underline-offset-2 hover:underline">
              Open
            </Link>
            <Link href={trackOrDraftHref(row)} className="text-[var(--teal-ink)] underline-offset-2 hover:underline">
              {isDraft ? "Continue draft" : "Track"}
            </Link>
            <form action={copyShipmentAction}>
              <input type="hidden" name="shipmentId" value={row.id} />
              <button type="submit" className="text-[var(--gold)] underline-offset-2 hover:underline">
                Copy / rebook
              </button>
            </form>
          </div>
        </div>
      </div>
    </li>
  );
}
