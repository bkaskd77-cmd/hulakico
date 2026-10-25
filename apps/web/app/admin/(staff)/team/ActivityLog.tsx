import Link from "next/link";
import { listAudit, type AuditEntry } from "@/lib/data/audit-log";

const GROUPS = {
  all: { label: "All", match: () => true },
  money: { label: "Money", match: (a: string) => a.startsWith("payment.") || a.startsWith("cod.") || a === "contact.bank_change" },
  shipments: { label: "Shipments", match: (a: string) => a.startsWith("shipment.") || a.startsWith("exception.") },
  rates: { label: "Rates", match: (a: string) => a.startsWith("rate.") || a.startsWith("carrier.") },
  content: { label: "Website", match: (a: string) => a.startsWith("content.") || a.startsWith("contact.") },
  access: { label: "Sign-ins & team", match: (a: string) => a.startsWith("staff.") || a.startsWith("team.") },
} as const;

export type ActivityGroup = keyof typeof GROUPS;

const LABELS: Record<string, string> = {
  "staff.signin": "Signed in",
  "staff.signin.wrong_code": "Wrong two-step code",
  "payment.mark_paid": "Marked payment received",
  "cod.collected": "COD collected",
  "shipment.cancel": "Cancelled shipment",
  "shipment.status": "Tracking update",
  "shipment.partner_awb": "Partner AWB saved",
  "exception.resolve": "Resolved exception",
  "rate.update": "Edited rate",
  "rate.add": "Added rate",
  "rate.remove": "Removed rate",
  "carrier.add": "Added carrier",
  "team.role": "Changed staff role",
  "team.remove": "Removed staff access",
  "contact.update": "Edited contact details",
  "contact.bank_change": "Changed bank / QR details",
  "content.homepage": "Edited homepage",
  "content.pages": "Edited pages",
  "content.services": "Edited services",
  "content.lane": "Country page",
  "content.city": "City page",
  "content.city_remove": "Removed city page",
  "content.notes": "Edited desk notes",
};

/** Actions that move money or lock people out stand out in the list. */
const ALERT = new Set(["contact.bank_change", "staff.signin.wrong_code", "team.remove", "team.role", "payment.mark_paid"]);

export function isActivityGroup(value: unknown): value is ActivityGroup {
  return typeof value === "string" && value in GROUPS;
}

function nepalTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Kathmandu", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function Row({ entry }: { entry: AuditEntry }) {
  const alert = ALERT.has(entry.action);
  return (
    <li className="grid gap-1 border-b border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] py-3 last:border-0 sm:grid-cols-[7.5rem_1fr] sm:gap-4">
      <time dateTime={entry.createdAt} className="text-xs tabular-nums text-[var(--muted)]">{nepalTime(entry.createdAt)}</time>
      <div className="min-w-0">
        <p className="text-sm">
          <span className={`font-semibold ${alert ? "text-[var(--gold)]" : "text-[var(--off-white)]"}`}>{LABELS[entry.action] ?? entry.action}</span>
          {entry.target ? <span className="text-[var(--muted)]"> · <span className="break-all">{entry.target}</span></span> : null}
        </p>
        {entry.detail ? <p className="mt-0.5 break-words text-xs text-[var(--muted)]">{entry.detail}</p> : null}
        <p className="mt-0.5 text-xs text-[var(--teal)]">
          {entry.staffEmail}{entry.ip ? <span className="text-[var(--muted)]"> · {entry.ip}</span> : null}
        </p>
      </div>
    </li>
  );
}

/** Admin activity log on the Team page: who changed what, newest first, in Nepal time. */
export async function ActivityLog({ group }: { group: ActivityGroup }) {
  const entries = await listAudit(300);
  const shown = "error" in entries ? [] : entries.filter((entry) => GROUPS[group].match(entry.action)).slice(0, 100);
  return (
    <section className="mt-12" aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">Activity log</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Every Admin change and staff sign-in, newest first (Nepal time).</p>
      <nav aria-label="Filter activity" className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(GROUPS) as ActivityGroup[]).map((key) => (
          <Link key={key} href={key === "all" ? "/admin/team#activity-heading" : `/admin/team?log=${key}#activity-heading`} aria-current={key === group ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${key === group
              ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--navy)]"
              : "border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] text-[var(--off-white)] hover:border-[var(--gold)]"}`}>
            {GROUPS[key].label}
          </Link>
        ))}
      </nav>
      {"error" in entries ? <p role="alert" className="mt-4 text-sm text-[var(--danger)]">{entries.error}</p> : null}
      <div className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] px-5">
        {shown.length ? <ul>{shown.map((entry) => <Row key={entry.id} entry={entry} />)}</ul>
          : <p className="py-6 text-sm text-[var(--muted)]">Nothing recorded here yet.</p>}
      </div>
    </section>
  );
}
