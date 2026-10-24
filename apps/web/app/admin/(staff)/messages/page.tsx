import Link from "next/link";
import { revalidatePath } from "next/cache";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import {
  isMessageStatus,
  listContactMessages,
  MESSAGES_PER_PAGE,
  setContactMessageStatus,
  type MessageStatus,
  type MessageView,
} from "@/lib/data/contact-messages";
import { CONTACT_TOPICS } from "@/lib/domain/contact";
import { canAccess } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

const VIEWS: { id: MessageView; label: string }[] = [
  { id: "open", label: "Inbox" },
  { id: "archived", label: "Archived" },
  { id: "all", label: "All" },
];
const STATUS_LABEL: Record<MessageStatus, string> = { NEW: "New", READ: "Read", REPLIED: "Replied", ARCHIVED: "Archived" };
const NEXT_STEPS: Record<MessageStatus, MessageStatus[]> = {
  NEW: ["READ", "REPLIED", "ARCHIVED"],
  READ: ["REPLIED", "ARCHIVED", "NEW"],
  REPLIED: ["ARCHIVED", "NEW"],
  ARCHIVED: ["NEW"],
};
const ACTION_LABEL: Record<MessageStatus, string> = { NEW: "Mark new", READ: "Mark read", REPLIED: "Mark replied", ARCHIVED: "Archive" };
const CARD = "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5";
const PILL = "rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--off-white)] hover:border-[var(--gold)]";

async function updateStatusAction(formData: FormData): Promise<void> {
  "use server";
  try {
    const access = await resolveStaffAccess(await readStaffSessionToken());
    if (!access.ok || !canAccess(access.staff.role, "operations")) return;
    const id = String(formData.get("id") ?? "");
    const status = formData.get("status");
    if (!isMessageStatus(status)) return;
    const result = await setContactMessageStatus(id, status);
    if ("error" in result) console.error("[messages/page.tsx:updateStatusAction]", result.error);
    revalidatePath("/admin/messages");
  } catch (error) {
    console.error("[messages/page.tsx:updateStatusAction]", error instanceof Error ? error.message : error);
  }
}

function topicLabel(value: string): string {
  return CONTACT_TOPICS.find((topic) => topic.value === value)?.label ?? value;
}

function replyHref(email: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Re: Your Hulakico enquiry")}`;
}

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaffPage("operations");
  const params = await searchParams;
  const view: MessageView = VIEWS.some((v) => v.id === params.view) ? (params.view as MessageView) : "open";
  const page = Math.min(1000, Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1));
  const result = await listContactMessages(view, page);
  const pages = "error" in result ? 1 : Math.max(1, Math.ceil(result.total / MESSAGES_PER_PAGE));
  const link = (v: MessageView, p = 1) => `/admin/messages?view=${v}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Customers</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">Contact messages</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Messages from the website contact form, newest first. Reply by email, then mark the message replied or archive it.
        {"error" in result ? null : ` ${result.newCount} new.`}
      </p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Message views">
        {VIEWS.map((v) => (
          <Link key={v.id} href={link(v.id)} aria-current={v.id === view ? "page" : undefined} className={v.id === view ? `${PILL} border-[var(--gold)] text-[var(--gold)]` : PILL}>
            {v.label}
          </Link>
        ))}
      </nav>

      {"error" in result ? <p role="alert" className="mt-8 text-sm text-[var(--danger)]">{result.error}</p> : null}
      {"error" in result || result.items.length ? null : <p className="mt-8 text-sm text-[var(--muted)]">No messages here.</p>}

      <ul className="mt-6 space-y-4">
        {"error" in result ? null : result.items.map((m) => (
          <li key={m.id} className={CARD}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--off-white)]">{m.name}</p>
                <p className="mt-0.5 break-all text-sm text-[var(--teal)]">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {topicLabel(m.topic)}{m.reference ? ` · AWB ${m.reference}` : ""} · {new Date(m.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Kathmandu" })}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.status === "NEW" ? "bg-[var(--gold)] text-[var(--navy)]" : "border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] text-[var(--muted)]"}`}>
                {STATUS_LABEL[m.status]}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--off-white)]">{m.message}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a href={replyHref(m.email)} className={`${PILL} bg-[var(--gold)] text-[var(--navy)]`}>Reply by email</a>
              {NEXT_STEPS[m.status].map((status) => (
                <form key={status} action={updateStatusAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value={status} />
                  <button type="submit" className={PILL}>{ACTION_LABEL[status]}</button>
                </form>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <nav className="mt-8 flex items-center gap-3 text-sm" aria-label="Pages">
          {page > 1 ? <Link href={link(view, page - 1)} className={PILL}>Newer</Link> : null}
          <span className="text-[var(--muted)]">Page {page} of {pages}</span>
          {page < pages ? <Link href={link(view, page + 1)} className={PILL}>Older</Link> : null}
        </nav>
      ) : null}
    </>
  );
}
