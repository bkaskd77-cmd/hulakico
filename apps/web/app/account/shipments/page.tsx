import Link from "next/link";
import { redirect } from "next/navigation";
import { NeedsAttentionStrip } from "@/app/account/NeedsAttentionStrip";
import { ShipmentListCard } from "@/app/account/ShipmentListCard";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { listAttentionItems } from "@/lib/data/shipment-attention";
import {
  HUB_STATUS_FILTERS,
  listMyShipments,
  SHIPMENTS_MAX_PAGE_BUTTONS,
  type HubFilterKey,
} from "@/lib/data/my-shipments";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

function hubHref(opts: { page?: number; filter?: HubFilterKey; q?: string }) {
  const params = new URLSearchParams();
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  if (opts.filter && opts.filter !== "all") params.set("filter", opts.filter);
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  const qs = params.toString();
  return qs ? `/account/shipments?${qs}` : "/account/shipments";
}

export default async function AccountShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; copy?: string; filter?: string; q?: string }>;
}) {
  const token = await readSessionToken();
  if (!token) redirect("/signin");
  const user = await getUserBySessionToken(token);
  if (!user) redirect("/signin");

  const params = await searchParams;
  const copyError = params.copy && params.copy !== "missing" ? params.copy : null;
  const [list, attention] = await Promise.all([
    listMyShipments(user.id, Number(params.page ?? "1"), {
      filter: params.filter as HubFilterKey | undefined,
      q: params.q,
    }),
    listAttentionItems(user.id),
  ]);
  const pageNumbers = Array.from(
    { length: Math.min(list.pageCount, SHIPMENTS_MAX_PAGE_BUTTONS) },
    (_, i) => i + 1,
  );
  const edge = "border-[color-mix(in_srgb,var(--off-white)_14%,transparent)]";

  return (
    <div className="shell-sky px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className={`flex flex-wrap items-end justify-between gap-4 border-b ${edge} pb-6`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">Your control tower</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)]">
              All shipments
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/account" className="font-semibold text-[var(--off-white)] underline-offset-2 hover:underline">Account</Link>
            <Link href="/book" className="rounded-md bg-[var(--gold)] px-4 py-2 font-semibold text-[var(--navy)]">
              Book a shipment
            </Link>
          </div>
        </header>

        <NeedsAttentionStrip items={attention} />

        <form action="/account/shipments" method="get" className="mt-6 flex flex-wrap gap-2">
          {list.filter !== "all" ? <input type="hidden" name="filter" value={list.filter} /> : null}
          <input name="q" defaultValue={list.q} placeholder="Search AWB, city, name, contents…"
            className={`min-w-[16rem] flex-1 rounded-md border ${edge} bg-[var(--navy)] px-3 py-2 text-sm text-[var(--off-white)] outline-none focus:border-[var(--teal)]`} />
          <button type="submit" className="rounded-md bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-[var(--off-white)]">Search</button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {HUB_STATUS_FILTERS.map((item) => {
            const active = list.filter === item.key;
            return (
              <Link key={item.key} href={hubHref({ filter: item.key, q: list.q })}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-[var(--gold)] text-[var(--navy)]"
                    : `border ${edge} bg-[var(--navy-elevated)] text-[var(--off-white)]`
                }`}>
                {item.label}
                <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[10px] ${active ? "bg-[var(--navy)]/15" : "bg-[var(--navy)]"}`}>
                  {list.filterCounts[item.key] ?? 0}
                </span>
              </Link>
            );
          })}
        </div>

        {copyError ? <p className="mt-4 text-sm text-[var(--danger)]">{decodeURIComponent(copyError)}</p> : null}

        {list.total === 0 ? (
          <div className={`mt-10 rounded-lg border border-dashed ${edge} bg-[var(--navy-elevated)] p-8 text-center`}>
            <p className="text-sm text-[var(--muted)]">
              {list.q || list.filter !== "all" ? "No shipments match this filter or search." : "No shipments yet. Book your first send."}
            </p>
            <Link href="/book" className="mt-5 inline-block rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]">
              Book a shipment
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-[var(--muted)]">
              Showing {(list.page - 1) * list.pageSize + 1}–{Math.min(list.page * list.pageSize, list.total)} of {list.total}
            </p>
            <ul className="mt-4 space-y-4">
              {list.rows.map((row) => <ShipmentListCard key={row.id} row={row} />)}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--muted)]">Page {list.page} of {list.pageCount}</span>
              {pageNumbers.map((n) => (
                <Link key={n} href={hubHref({ page: n, filter: list.filter, q: list.q })}
                  className={`rounded px-2.5 py-1 text-xs font-semibold ${
                    n === list.page
                      ? "bg-[var(--gold)] text-[var(--navy)]"
                      : `border ${edge} text-[var(--off-white)]`
                  }`}>{n}</Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
