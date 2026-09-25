import Link from "next/link";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { readSessionToken } from "@/lib/http/session-cookie";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

/** Back target depends on who is viewing the public track page. */
export async function TrackBackNav() {
  try {
    const staffToken = await readStaffSessionToken();
    if (resolveStaffAccess(staffToken).ok) {
      return (
        <Link
          href="/admin/shipments"
          className="text-sm font-semibold text-[var(--off-white)] underline-offset-2 hover:underline"
        >
          Back to Admin shipments
        </Link>
      );
    }

    const userToken = await readSessionToken();
    const user = userToken ? getUserBySessionToken(userToken) : null;
    if (user) {
      return (
        <Link
          href="/account/shipments"
          className="text-sm font-semibold text-[var(--off-white)] underline-offset-2 hover:underline"
        >
          Back to my shipments
        </Link>
      );
    }

    return (
      <Link
        href="/account"
        className="text-sm font-semibold text-[var(--off-white)] underline-offset-2 hover:underline"
      >
        My account
      </Link>
    );
  } catch (error) {
    console.error(
      "[TrackBackNav.tsx:TrackBackNav]",
      error instanceof Error ? error.message : error,
    );
    return (
      <Link
        href="/account"
        className="text-sm font-semibold text-[var(--off-white)] underline-offset-2 hover:underline"
      >
        My account
      </Link>
    );
  }
}
