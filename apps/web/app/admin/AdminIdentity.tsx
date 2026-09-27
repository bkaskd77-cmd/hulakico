import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminMark } from "@/app/admin/AdminMark";
import { destroyStaffSession } from "@/lib/data/staff-auth";
import {
  clearStaffSessionCookie,
  readStaffSessionToken,
} from "@/lib/http/staff-session-cookie";

async function signOutStaff() {
  "use server";
  try {
    const token = await readStaffSessionToken();
    if (token) await destroyStaffSession(token);
    await clearStaffSessionCookie();
  } catch (error) {
    console.error(
      "[AdminIdentity.tsx:signOutStaff]",
      error instanceof Error ? error.message : error,
    );
  }
  redirect("/admin");
}

/** Signed-in Admin identity: logo, holder name, and log out. */
export function AdminIdentity({
  name,
  email,
  roleLabel,
  showTeamLink,
}: {
  name: string;
  email: string;
  roleLabel: string;
  showTeamLink: boolean;
}) {
  const holder = name.trim();
  const title = holder || email;

  return (
    <div>
      <Link href="/admin" className="inline-flex" aria-label="Hulakico Admin">
        <AdminMark />
      </Link>
      <p className="mt-3 text-sm font-semibold text-[var(--off-white)]">{title}</p>
      <p className="text-xs text-[var(--muted)]">
        {roleLabel}
        {holder ? ` · ${email}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <form action={signOutStaff}>
          <button
            type="submit"
            className="text-xs font-semibold text-[var(--gold)] underline-offset-2 hover:underline"
          >
            Log out
          </button>
        </form>
        {showTeamLink ? (
          <Link
            href="/admin/signup"
            className="text-xs font-semibold text-[var(--teal)] underline-offset-2 hover:underline"
          >
            + Add staff account
          </Link>
        ) : null}
      </div>
    </div>
  );
}
