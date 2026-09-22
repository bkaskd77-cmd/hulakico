import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserBySessionToken, destroySession } from "@/lib/data/auth-store";
import { listMyShipments } from "@/lib/data/my-shipments";
import {
  clearSessionCookie,
  readSessionToken,
} from "@/lib/http/session-cookie";

export const runtime = "nodejs";

async function signOutAction() {
  "use server";
  try {
    const token = await readSessionToken();
    if (token) destroySession(token);
    await clearSessionCookie();
  } catch (error) {
    console.error(
      "[account/page.tsx:signOutAction]",
      error instanceof Error ? error.message : error,
    );
  }
  redirect("/signin");
}

function shipmentHref(row: { id: string; status: string; trackingToken: string | null }) {
  if (row.status === "DRAFT" || row.status === "QUOTED") return `/book/draft/${row.id}`;
  if (row.trackingToken) return `/track/${row.trackingToken}`;
  return `/book/draft/${row.id}`;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ ops?: string; page?: string }>;
}) {
  const token = await readSessionToken();
  if (!token) redirect("/signin");
  const user = getUserBySessionToken(token);
  if (!user) redirect("/signin");

  const params = await searchParams;
  const opsDenied = params.ops === "denied";
  const page = Number(params.page ?? "1");
  const list = listMyShipments(user.id, page);
  const pageNumbers = Array.from({ length: list.pageCount }, (_, i) => i + 1);

  return (
    <div className="shell-sky min-h-dvh px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
            Welcome, {user.name}
          </p>
          {opsDenied ? (
            <p className="mt-3 text-sm text-[var(--danger)]">
              Ops tower is limited to Hulakico OPS/ADMIN accounts.
            </p>
          ) : null}
          <dl className="mt-6 space-y-3 text-sm text-[var(--muted)]">
            <div>
              <dt className="text-xs uppercase tracking-wide">Email</dt>
              <dd className="text-[var(--off-white)]">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Account</dt>
              <dd className="text-[var(--off-white)]">{user.accountType}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book" className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]">
              Book a shipment
            </Link>
            <Link href="/ops" className="rounded-md bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-[var(--off-white)]">
              Ops tower
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="rounded-md border border-[var(--muted)] px-4 py-2 text-sm text-[var(--off-white)]">
                Sign out
              </button>
            </form>
          </div>
          <Link href="/" className="mt-4 inline-block text-sm text-[var(--teal)] underline">Back to home</Link>
        </div>

        <section className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">
            All shipments
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            10 per page. Finished (delivered/cancelled/RTO) stay 3 months, then auto-removed.
          </p>
          {list.total === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">No shipments yet — book your first one.</p>
          ) : (
            <>
              <ul className="mt-4 space-y-3">
                {list.rows.map((row) => (
                  <li key={row.id} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] px-3 py-3 text-sm">
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
                    <Link href={shipmentHref(row)} className="mt-2 inline-block text-xs text-[var(--gold)] underline">
                      {row.status === "DRAFT" || row.status === "QUOTED" ? "Open draft" : "Track"}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[var(--muted)]">
                  Page {list.page} of {list.pageCount} · {list.total} total
                </span>
                {pageNumbers.map((n) => (
                  <Link
                    key={n}
                    href={n === 1 ? "/account" : `/account?page=${n}`}
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      n === list.page
                        ? "bg-[var(--gold)] text-[var(--navy)]"
                        : "border border-[var(--teal)] text-[var(--teal)]"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
                {list.page < list.pageCount ? (
                  <Link
                    href={`/account?page=${list.page + 1}`}
                    className="text-xs font-semibold text-[var(--gold)] underline"
                  >
                    View more
                  </Link>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
