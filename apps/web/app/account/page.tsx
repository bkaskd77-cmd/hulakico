import Link from "next/link";
import { redirect } from "next/navigation";
import { NeedsAttentionStrip } from "@/app/account/NeedsAttentionStrip";
import { signOutAction } from "@/app/account/sign-out";
import { VerifyEmailBanner } from "@/app/account/VerifyEmailBanner";
import { isEmailVerified } from "@/lib/data/email-verification";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { listAttentionItems } from "@/lib/data/shipment-attention";
import { listMyShipments } from "@/lib/data/my-shipments";
import { readSessionToken } from "@/lib/http/session-cookie";
import { codeLabel, statusLabel } from "@/lib/domain/shipment-labels";

export const runtime = "nodejs";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ ops?: string; admin?: string; copy?: string }>;
}) {
  const token = await readSessionToken();
  if (!token) redirect("/signin");
  const user = await getUserBySessionToken(token);
  if (!user) redirect("/signin");

  const params = await searchParams;
  const [list, attention, verified] = await Promise.all([
    listMyShipments(user.id, 1),
    listAttentionItems(user.id),
    isEmailVerified(user.id),
  ]);
  const latest = list.rows[0] ?? null;
  const recent = list.rows.slice(0, 3);
  // Only the newest unfinished draft is offered; older ones stay under All shipments.
  const draft = list.rows.find((row) => row.status === "DRAFT" || row.status === "QUOTED") ?? null;
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

        {verified ? null : <VerifyEmailBanner email={user.email} />}

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
            <p className="mt-1 text-sm text-[var(--muted)]">{codeLabel(user.accountType)} account</p>
          </div>
        </div>

        {draft ? (
          <Link href={`/book/draft/${draft.id}`}
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] px-5 py-4 transition hover:bg-[color-mix(in_srgb,var(--gold)_18%,transparent)]">
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Continue where you left off</span>
              <span className="mt-1 block font-semibold text-[var(--off-white)]">{draft.originCity} → {draft.destinationCity}</span>
              <span className="block text-xs text-[var(--muted)]">Unfinished drafts are removed after 30 days without changes.</span>
            </span>
            <span className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]">Finish booking</span>
          </Link>
        ) : null}

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
                        {row.hulakicoAwb ?? "No AWB yet"} · {statusLabel(row.status)}
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
