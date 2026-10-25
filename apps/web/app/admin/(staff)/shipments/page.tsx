import Link from "next/link";
import { StatusPill } from "@/app/StatusPill";
import { countOpsShipments, listOpsShipments, resolveOpsFilter, type OpsShipmentFilter } from "@/lib/data/ops-shipments";
import { customerPartnerAwb, laneLabel, nepalTime } from "@/lib/domain/shipment-labels";
import { requireStaffPage } from "@/lib/http/require-staff";

export const runtime = "nodejs";

const TABS: Array<{ key: OpsShipmentFilter; label: string }> = [
  { key: "running", label: "In progress" },
  { key: "drafts", label: "Drafts & quotes" },
  { key: "delivered", label: "Delivered" },
  { key: "closed", label: "Cancelled & returned" },
  { key: "all", label: "All" },
];

const CARD = "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)]";
const BTN_GOLD = "rounded-md bg-[#ffcc00] px-3 py-1.5 text-xs font-semibold text-[#191919]";
const BTN_OUTLINE = "rounded-md border border-[color-mix(in_srgb,var(--off-white)_40%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--off-white)] hover:border-[#ffcc00]";

function tabHref(key: OpsShipmentFilter, query: string): string {
  const params = new URLSearchParams({ filter: key });
  if (query) params.set("q", query);
  return `/admin/shipments?${params.toString()}`;
}

export default async function AdminShipmentsPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  await requireStaffPage("operations");
  const params = await searchParams;
  const filter = resolveOpsFilter(params.filter ?? "running");
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  let shipments: Awaited<ReturnType<typeof listOpsShipments>> = [];
  let error: string | null = null;
  const counts = await countOpsShipments();
  try {
    shipments = await listOpsShipments(filter, query);
  } catch (err) {
    console.error("[admin/shipments/page.tsx:AdminShipmentsPage]", err instanceof Error ? err.message : err);
    error = "Could not load shipments.";
  }

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)] sm:text-4xl">Shipments</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Find any shipment by AWB, city, or customer. Open it to post tracking updates, payments, and exceptions.</p>

      <form action="/admin/shipments" className="mt-5 flex gap-2">
        <input type="hidden" name="filter" value={filter} />
        <label className="sr-only" htmlFor="shipment-search">Search shipments</label>
        <input id="shipment-search" name="q" defaultValue={query} maxLength={60} placeholder="AWB, city, customer name or email"
          className="min-w-0 flex-1 rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[var(--navy)] px-3 py-2 text-sm text-[var(--off-white)]" />
        <button type="submit" className={BTN_GOLD}>Search</button>
        {query ? <Link href={tabHref(filter, "")} className={BTN_OUTLINE}>Clear</Link> : null}
      </form>

      <nav aria-label="Shipment filters" className="-mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <Link key={tab.key} href={tabHref(tab.key, query)} prefetch aria-current={active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active
                ? "border-[#ffcc00] bg-[#ffcc00] text-[#191919]"
                : "border-[color-mix(in_srgb,var(--off-white)_28%,transparent)] text-[var(--off-white)] hover:border-[#ffcc00]"}`}>
              {tab.label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${active ? "bg-black/10" : "bg-white/10"}`}>{counts[tab.key]}</span>
            </Link>
          );
        })}
      </nav>

      {query ? <p className="mt-4 text-sm text-[var(--muted)]">{shipments.length} result{shipments.length === 1 ? "" : "s"} for “{query}”</p> : null}
      {error ? <p role="alert" className="mt-8 text-[var(--danger)]">{error}</p> : null}
      <ul className="mt-4 grid gap-3 lg:grid-cols-2">
        {shipments.map((shipment) => {
          const href = `/admin/shipments/${shipment.id}`;
          const partnerAwb = customerPartnerAwb(shipment.externalAwb);
          return (
            <li key={shipment.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--off-white)]">{shipment.originCity} → {shipment.destinationCity}</p>
                  <p className="mt-0.5 text-xs text-[color-mix(in_srgb,var(--off-white)_78%,transparent)]">
                    {shipment.customerName} · {laneLabel(shipment.lane)} · {nepalTime(shipment.updatedAt)}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-[color-mix(in_srgb,var(--off-white)_78%,transparent)]">
                    {shipment.hulakicoAwb ?? "No AWB yet"}
                    {partnerAwb ? ` · ${shipment.partnerLabel ?? "Partner"} ${partnerAwb}` : shipment.hulakicoAwb ? " · partner AWB not entered" : ""}
                  </p>
                </div>
                <StatusPill status={shipment.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {shipment.openExceptionId ? <span className="rounded-full border border-red-400/60 bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-200">Exception open</span> : null}
                <Link href={href} prefetch className={BTN_GOLD}>View</Link>
                <Link href={`${href}?ops=1`} prefetch className={BTN_OUTLINE}>Manage</Link>
              </div>
            </li>
          );
        })}
      </ul>
      {shipments.length === 0 && !error ? (
        <p className={`${CARD} mt-6 p-6 text-sm text-[var(--muted)]`}>{query ? "No shipment matches that search." : "No shipments in this list."}</p>
      ) : null}
    </>
  );
}
