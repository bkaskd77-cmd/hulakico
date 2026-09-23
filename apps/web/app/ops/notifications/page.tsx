import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { listRecentNotifications } from "@/lib/data/notifications";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function OpsNotificationsPage() {
  const token = await readSessionToken();
  const access = resolveOpsAccess(token);
  if (!access.ok) {
    redirect(access.status === 401 ? "/signin" : "/account?ops=denied");
  }

  let items: ReturnType<typeof listRecentNotifications> = [];
  let error: string | null = null;
  try {
    items = listRecentNotifications(40);
  } catch (err) {
    console.error("[ops/notifications/page.tsx]", err instanceof Error ? err.message : err);
    error = "Could not load notifications.";
  }

  return (
    <div className="shell-sky min-h-dvh px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">Ops control tower</p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Stub EMAIL log — not sent to inboxes until a mail provider is connected.
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/ops" className="text-[var(--teal)] underline">Shipments</Link>
            <Link href="/ops/exceptions" className="text-[var(--gold)] underline">Exceptions</Link>
            <Link href="/ops/cod" className="text-[var(--gold)] underline">COD</Link>
          </nav>
        </div>

        {error ? <p className="mt-8 text-[var(--danger)]">{error}</p> : null}

        <ul className="mt-8 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4"
            >
              <p className="font-semibold text-[var(--off-white)]">{item.subject}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {item.kind} · {item.channel} · {item.status} · {item.provider} ·{" "}
                {item.hulakicoAwb ?? item.shipmentId}
              </p>
              <p className="mt-1 break-all text-xs text-[var(--teal)]">{item.recipient}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
        {items.length === 0 && !error ? (
          <p className="mt-8 text-sm text-[var(--muted)]">
            No notifications logged yet. Book a shipment or flag a Hold.
          </p>
        ) : null}
      </div>
    </div>
  );
}
