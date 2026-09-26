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
  searchParams: Promise<{ ops?: string; admin?: string; copy?: string; welcome?: string }>;
}) {
  const token = await readSessionToken();
  if (!token) redirect("/signin");
  const user = await getUserBySessionToken(token);
  if (!user) redirect("/signin");

  const params = await searchParams;
  const list = listMyShipments(user.id, 1);
  const attention = listAttentionItems(user.id);
  const latest = list.rows[0] ?? null;
  const recent = list.rows.slice(0, 3);
  const panel =
    "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5";

  return (
    <div className="shell-sky px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">Your control tower</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">
              Welcome, {user.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Book, track, and settle from one Hulakico account.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/" className="font-semibold text-[var(--off-white)] underline-offset-2 hover:underline">Home</Link>
            <form action={signOutAction}>
              <button type="submit" className="font-semibold text-[var(--off-white)] underline-offset-2 hover:underline">Sign out</button>
            </form>
          </div>
        </header>

        {params.welcome === "1" ? (
          <p role="status" className="mt-4 rounded-md border border-[var(--teal)] bg-[color-mix(in_srgb,var(--teal)_14%,transparent)] px-4 py-3 text-sm text-[var(--off-white)]">
            Account created — you’re signed in as {user.email}.
          </p>
        ) : null}
        {params.ops === "denied" || params.admin === "denied" ? (
          <p className="mt-4 text-sm text-[var(--danger)]">Staff tools live at /admin — use a staff account there.</p>
        ) : null}
        {params.copy && params.copy !== "missing" ? (
          <p className="mt-4 text-sm text-[var(--danger)]">{decodeURIComponent(params.copy)}</p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link href="/book" className={`${panel} transition hover:border-[var(--gold)]`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Book</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">New shipment</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Start a domestic or international send.</p>
          </Link>
          <Link href="/account/shipments" className={`${panel} transition hover:border-[var(--teal)]`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Hub</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">All shipments</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {list.total > 0 ? `${list.total} in your tower` : "No shipments yet"}
            </p>
          </Link>
          <div className={panel}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Profile</p>
            <p className="mt-2 break-all text-sm font-semibold text-[var(--off-white)]">{user.email}</p>
            <p className="mt-1 text-sm uppercase tracking-wide text-[var(--muted)]">{user.accountType}</p>
          </div>
        </div>

        <NeedsAttentionStrip items={attention} />

        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">Recent activity</h2>
            {list.total > 0 ? (
              <Link href="/account/shipments" className="text-sm font-semibold text-[var(--teal)] underline-offset-2 hover:underline">
                View all
              </Link>
            ) : null}
          </div>
          {recent.length === 0 ? (
            <div className={`mt-4 ${panel} border-dashed text-center`}>
              <p className="text-sm text-[var(--muted)]">No shipments yet — book your first send.</p>
              <Link href="/book" className="mt-4 inline-block rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]">
                Book a shipment
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {recent.map((row) => (
                <li key={row.id}>
                  <Link href={`/account/shipments/${row.id}`}
                    className={`flex flex-wrap items-center justify-between gap-2 ${panel} py-3 transition hover:border-[var(--teal)]`}>
                    <div>
                      <p className="font-semibold text-[var(--off-white)]">{row.originCity} → {row.destinationCity}</p>
                      <p className="text-xs text-[var(--muted)]">
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
              className="mt-4 inline-flex text-sm font-semibold text-[var(--off-white)] underline-offset-2 hover:underline">
              Track latest shipment →
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}
