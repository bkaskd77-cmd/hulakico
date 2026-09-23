import Link from "next/link";
import { redirect } from "next/navigation";
import { copyShipmentAction } from "@/app/account/copy-actions";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import {
  listMyShipments,
  SHIPMENTS_MAX_PAGE_BUTTONS,
  SHIPMENTS_PAGE_SIZE,
  type MyShipmentRow,
} from "@/lib/data/my-shipments";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

function shipmentHref(row: MyShipmentRow) {
  if (row.status === "DRAFT" || row.status === "QUOTED") return `/book/draft/${row.id}`;
  if (row.trackingToken) return `/track/${row.trackingToken}`;
  return `/book/draft/${row.id}`;
}

function pageHref(n: number) {
  return n === 1 ? "/account/shipments" : `/account/shipments?page=${n}`;
}

export default async function AccountShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; copy?: string }>;
}) {
  const token = await readSessionToken();
  if (!token) redirect("/signin");
  const user = getUserBySessionToken(token);
  if (!user) redirect("/signin");

  const params = await searchParams;
  const copyError = params.copy && params.copy !== "missing" ? params.copy : null;
  const list = listMyShipments(user.id, Number(params.page ?? "1"));
  const pageNumbers = Array.from(
    { length: Math.min(list.pageCount, SHIPMENTS_MAX_PAGE_BUTTONS) },
    (_, i) => i + 1,
  );

  return (
    <div className="shell-sky min-h-dvh px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-lg rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">Account</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
          All shipments
        </h1>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {SHIPMENTS_PAGE_SIZE} per page · pages 1–{SHIPMENTS_MAX_PAGE_BUTTONS}. Finished stay 3 months.
        </p>
        {copyError ? (
          <p className="mt-3 text-sm text-[var(--danger)]">{decodeURIComponent(copyError)}</p>
        ) : null}

        {list.total === 0 ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              No shipments yet. Book your first send — drafts and bookings appear here.
            </p>
            <Link href="/book"
              className="inline-block rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]">
              Book a shipment
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-6 space-y-3">
              {list.rows.map((row) => (
                <li key={row.id}
                  className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--off-white)]">
                      {row.originCity} → {row.destinationCity}
                    </p>
                    <span className="text-xs uppercase tracking-wide text-[var(--teal)]">{row.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {row.lane}{row.hulakicoAwb ? ` · ${row.hulakicoAwb}` : ""} ·{" "}
                    {new Date(row.updatedAt).toLocaleString()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <Link href={`/account/shipments/${row.id}`}
                      className="text-xs font-semibold text-[var(--off-white)] underline">Open shipment</Link>
                    <Link href={shipmentHref(row)} className="text-xs text-[var(--gold)] underline">
                      {row.status === "DRAFT" || row.status === "QUOTED" ? "Open draft" : "Track"}
                    </Link>
                    <form action={copyShipmentAction}>
                      <input type="hidden" name="shipmentId" value={row.id} />
                      <button type="submit" className="text-xs font-semibold text-[var(--teal)] underline">
                        Copy / rebook
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--muted)]">
                Page {list.page} of {list.pageCount} · {list.total} total
              </span>
              {pageNumbers.map((n) => (
                <Link key={n} href={pageHref(n)}
                  className={`rounded px-2 py-1 text-xs font-semibold ${
                    n === list.page
                      ? "bg-[var(--gold)] text-[var(--navy)]"
                      : "border border-[var(--teal)] text-[var(--teal)]"
                  }`}>{n}</Link>
              ))}
              {list.page < list.pageCount ? (
                <Link href={pageHref(list.page + 1)}
                  className="text-xs font-semibold text-[var(--gold)] underline">View more</Link>
              ) : null}
            </div>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/account" className="text-[var(--teal)] underline">Back to account</Link>
          <Link href="/book" className="text-[var(--gold)] underline">Book another</Link>
        </div>
      </div>
    </div>
  );
}
