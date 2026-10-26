import Link from "next/link";
import { StatusPill } from "@/app/StatusPill";
import { listAdminTowerShipments, type AdminTowerRow } from "@/lib/data/admin-tower";
import { laneLabel } from "@/lib/domain/shipment-labels";

const RISK: Record<AdminTowerRow["etaLevel"], { text: string; className: string }> = {
  HIGH: { text: "High delay risk", className: "border-red-400/60 bg-red-500/15 text-red-200" },
  MEDIUM: { text: "Some delay risk", className: "border-amber-300/60 bg-amber-400/15 text-amber-100" },
  LOW: { text: "On track", className: "border-emerald-300/50 bg-emerald-400/15 text-emerald-100" },
  UNKNOWN: { text: "Risk not scored", className: "border-white/20 bg-white/5 text-white/70" },
};

const CARD = "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)]";

/** A count tile; warning colours only when there is something to act on. */
function Kpi({ label, value, tone = "", className = "" }: { label: string; value: number; tone?: string; className?: string }) {
  return (
    <div className={`${CARD} px-4 py-3 ${className}`}>
      <p className={`font-[family-name:var(--font-display)] text-3xl font-extrabold tabular-nums ${value > 0 && tone ? tone : "text-[var(--off-white)]"}`}>{value}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--off-white)_70%,transparent)]">{label}</p>
    </div>
  );
}

/** 0–1 urgency as a bar: what needs a person first. */
function UrgencyBar({ score }: { score: number }) {
  const pct = Math.round(Math.min(Math.max(score, 0), 1) * 100);
  const color = pct >= 66 ? "bg-red-400" : pct >= 33 ? "bg-amber-300" : "bg-emerald-300";
  return (
    <div className="mt-3" title={`Urgency ${pct}/100`}>
      <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--off-white)_65%,transparent)]">
        <span>Urgency</span><span className="tabular-nums">{pct}/100</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
    </div>
  );
}

function TowerCard({ row }: { row: AdminTowerRow }) {
  const risk = RISK[row.etaLevel];
  return (
    <li>
      <Link href={`/admin/shipments/${row.id}`} className={`${CARD} block p-4 transition hover:border-[#ffcc00]`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-[var(--off-white)]">{row.originCity} → {row.destinationCity}</p>
            <p className="mt-0.5 break-all text-xs text-[color-mix(in_srgb,var(--off-white)_72%,transparent)]">
              {row.hulakicoAwb ?? "No AWB yet"} · {laneLabel(row.lane)} · {row.customerEmail}
            </p>
          </div>
          <StatusPill status={row.status} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className={`rounded-full border px-2.5 py-0.5 ${risk.className}`}>{risk.text}</span>
          {row.onHold ? <span className="rounded-full border border-red-400/60 bg-red-500/15 px-2.5 py-0.5 text-red-200">Exception open</span> : null}
          {row.payPending ? <span className="rounded-full border border-amber-300/60 bg-amber-400/15 px-2.5 py-0.5 text-amber-100">Payment not confirmed</span> : null}
        </div>
        {row.etaFactors.length > 0 ? (
          <p className="mt-2 text-xs text-[color-mix(in_srgb,var(--off-white)_72%,transparent)]">Why: {row.etaFactors.join(" · ")}</p>
        ) : null}
        <UrgencyBar score={row.urgencyScore} />
      </Link>
    </li>
  );
}

/** Admin home: live counts, then active shipments with the most urgent first. */
export async function AdminTowerBoard() {
  let rows: AdminTowerRow[] = [];
  let error: string | null = null;
  try {
    rows = await listAdminTowerShipments();
  } catch (err) {
    console.error("[AdminTowerBoard.tsx:AdminTowerBoard]", err instanceof Error ? err.message : err);
    error = "Could not load the dashboard shipments.";
  }
  const etaOffline = !error && rows.length > 0 && rows.every((row) => row.etaLevel === "UNKNOWN");
  const moving = rows.filter((row) => row.status === "IN_TRANSIT" || row.status === "OUT_FOR_DELIVERY").length;

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)] sm:text-4xl">Dashboard</h1>
      <p className="mt-1 max-w-xl text-sm text-[color-mix(in_srgb,var(--off-white)_78%,transparent)]">
        Every active shipment, most urgent first: delay risk, open exceptions, and unconfirmed payments.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Kpi label="Active" value={rows.length} className="col-span-2 sm:col-span-1" />
        <Kpi label="Moving" value={moving} />
        <Kpi label="Exceptions" value={rows.filter((row) => row.onHold).length} tone="text-red-300" />
        <Kpi label="Payment due" value={rows.filter((row) => row.payPending).length} tone="text-amber-200" />
        <Kpi label="High risk" value={rows.filter((row) => row.etaLevel === "HIGH").length} tone="text-red-300" />
      </div>

      {error ? <p role="alert" className="mt-8 text-[var(--danger)]">{error}</p> : null}
      {etaOffline ? (
        <p className="mt-4 text-sm text-[var(--gold)]">Delay-risk scoring is offline right now; urgency still uses exceptions and payments.</p>
      ) : null}

      <ul className="mt-6 grid gap-3 lg:grid-cols-2">
        {rows.map((row) => <TowerCard key={row.id} row={row} />)}
      </ul>
      {rows.length === 0 && !error ? (
        <p className={`${CARD} mt-6 p-6 text-sm text-[var(--muted)]`}>No active shipments right now. New bookings appear here as soon as they are confirmed.</p>
      ) : null}
    </>
  );
}
