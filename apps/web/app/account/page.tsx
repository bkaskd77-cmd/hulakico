import Link from "next/link";
import { redirect } from "next/navigation";
import { NeedsAttentionStrip } from "@/app/account/NeedsAttentionStrip";
import { signOutAction } from "@/app/account/sign-out";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { listAttentionItems } from "@/lib/data/shipment-attention";
import { listMyShipments } from "@/lib/data/my-shipments";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ ops?: string; admin?: string; copy?: string }>;
}) {
  const token = await readSessionToken();
  if (!token) redirect("/signin");
  const user = getUserBySessionToken(token);
  if (!user) redirect("/signin");

  const params = await searchParams;
  const list = listMyShipments(user.id, 1);
  const attention = listAttentionItems(user.id);
  const latest = list.rows[0] ?? null;
  const recent = list.rows.slice(0, 3);

  return (
    <div className="min-h-dvh bg-[#eef5f8] px-4 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">Your control tower</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome, {user.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">Book, track, and settle from one Hulakico account.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/" className="font-semibold text-slate-700 underline-offset-2 hover:underline">Home</Link>
            <form action={signOutAction}>
              <button type="submit" className="font-semibold text-slate-700 underline-offset-2 hover:underline">Sign out</button>
            </form>
          </div>
        </header>

        {params.ops === "denied" || params.admin === "denied" ? (
          <p className="mt-4 text-sm text-[var(--danger)]">Staff tools live at /admin — use a staff account there.</p>
        ) : null}
        {params.copy && params.copy !== "missing" ? (
          <p className="mt-4 text-sm text-[var(--danger)]">{decodeURIComponent(params.copy)}</p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link href="/book" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[var(--gold)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Book</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">New shipment</p>
            <p className="mt-1 text-sm text-slate-600">Start a domestic or international send.</p>
          </Link>
          <Link href="/account/shipments" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[var(--teal)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hub</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">All shipments</p>
            <p className="mt-1 text-sm text-slate-600">
              {list.total > 0 ? `${list.total} in your tower` : "No shipments yet"}
            </p>
          </Link>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-900">{user.email}</p>
            <p className="mt-1 text-sm uppercase tracking-wide text-slate-600">{user.accountType}</p>
          </div>
        </div>

        <NeedsAttentionStrip items={attention} />

        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">Recent activity</h2>
            {list.total > 0 ? (
              <Link href="/account/shipments" className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
                View all
              </Link>
            ) : null}
          </div>
          {recent.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-sm text-slate-600">No shipments yet — book your first send.</p>
              <Link href="/book" className="mt-4 inline-block rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]">
                Book a shipment
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {recent.map((row) => (
                <li key={row.id}>
                  <Link href={`/account/shipments/${row.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-[var(--teal)]">
                    <div>
                      <p className="font-semibold text-slate-900">{row.originCity} → {row.destinationCity}</p>
                      <p className="text-xs text-slate-600">
                        {row.hulakicoAwb ?? "Draft"} · {row.status.replaceAll("_", " ")}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--teal)]">Open</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {latest?.trackingToken ? (
            <Link href={`/track/${latest.trackingToken}`}
              className="mt-4 inline-flex text-sm font-semibold text-slate-700 underline-offset-2 hover:underline">
              Track latest shipment →
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}
