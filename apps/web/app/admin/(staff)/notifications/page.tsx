import { listRecentNotifications } from "@/lib/data/notifications";
import { requireStaffPage } from "@/lib/http/require-staff";

export const runtime = "nodejs";

export default async function AdminNotificationsPage() {
  await requireStaffPage();
  let items: Awaited<ReturnType<typeof listRecentNotifications>> = [];
  let error: string | null = null;
  try {
    items = await listRecentNotifications(40);
  } catch (err) {
    console.error(
      "[admin/notifications/page.tsx]",
      err instanceof Error ? err.message : err,
    );
    error = "Could not load notifications.";
  }

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
        Notifications
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Stub EMAIL log — not sent to inboxes until a mail provider is connected.
      </p>
      {error ? <p className="mt-8 text-[var(--danger)]">{error}</p> : null}
      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4"
          >
            <p className="font-semibold text-[var(--off-white)]">
              {item.subject}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {item.kind} · {item.channel} · {item.status} · {item.provider} ·{" "}
              {item.hulakicoAwb ?? item.shipmentId}
            </p>
            <p className="mt-1 break-all text-xs text-[var(--teal)]">
              {item.recipient}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
      {items.length === 0 && !error ? (
        <p className="mt-8 text-sm text-[var(--muted)]">
          No notifications logged yet.
        </p>
      ) : null}
    </>
  );
}
