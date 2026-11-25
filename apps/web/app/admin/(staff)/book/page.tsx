import { redirect } from "next/navigation";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { writeAudit } from "@/lib/data/audit-log";
import { DESK_NAME, startDeskSession } from "@/lib/data/desk-account";
import { canAccess } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { setSessionCookie } from "@/lib/http/session-cookie";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

const CARD = "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5";

/** Opens the normal booking wizard as the desk account. Operations staff only; every start is logged. */
async function startDeskBooking() {
  "use server";
  const access = await resolveStaffAccess(await readStaffSessionToken());
  if (!access.ok || !canAccess(access.staff.role, "operations")) redirect("/admin?denied=1");
  const session = await startDeskSession();
  if ("error" in session) redirect("/admin/book?failed=1");
  await setSessionCookie(session.token);
  await writeAudit(access.staff, "booking.desk_start", DESK_NAME);
  redirect("/book");
}

export default async function AdminBookPage({ searchParams }: { searchParams: Promise<{ failed?: string }> }) {
  await requireStaffPage("operations");
  const failed = (await searchParams).failed === "1";
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)] sm:text-4xl">Book a shipment</h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
        For customers who send their details by email, phone, or walk in. You fill in the same booking form customers use.
      </p>
      <section className={`mt-6 max-w-2xl ${CARD}`}>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--off-white)]">
          <li>Enter the sender, the receiver, and the box exactly as the customer sent them.</li>
          <li>For international goods, fill in the customs invoice (or attach the customer&apos;s invoice and let AI fill it).</li>
          <li>Payment works as usual: bank or QR with a reference, or cash on delivery. For cash at the desk, type &quot;Cash at desk&quot; as the reference and confirm it in Payments.</li>
          <li>Share the tracking link from the booking page with the customer. They do not need an account.</li>
        </ol>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Bookings are saved under the {DESK_NAME} account and booking emails go to the company inbox. Each start is recorded in Team &amp; activity.
        </p>
        <form action={startDeskBooking} className="mt-5">
          <button type="submit" className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]">Start booking</button>
        </form>
        {failed ? <p role="alert" className="mt-3 text-sm text-[var(--danger)]">Could not open the desk booking. Try again.</p> : null}
      </section>
    </div>
  );
}
