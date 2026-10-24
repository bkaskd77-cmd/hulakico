import Link from "next/link";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { readSessionToken } from "@/lib/http/session-cookie";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

type BackTarget = { href: string; label: string };

const ACCOUNT_TARGET: BackTarget = { href: "/account", label: "My account" };

/** Picks where "back" goes for whoever is viewing the public track page. */
async function resolveBackTarget(): Promise<BackTarget> {
  try {
    const staffToken = await readStaffSessionToken();
    if ((await resolveStaffAccess(staffToken)).ok) {
      return { href: "/admin/shipments", label: "Back to Admin shipments" };
    }
    const userToken = await readSessionToken();
    const user = userToken ? await getUserBySessionToken(userToken) : null;
    if (user) return { href: "/account/shipments", label: "Back to my shipments" };
    return ACCOUNT_TARGET;
  } catch (error) {
    console.error(
      "[TrackBackNav.tsx:resolveBackTarget]",
      error instanceof Error ? error.message : error,
    );
    return ACCOUNT_TARGET;
  }
}

/** Back target depends on who is viewing the public track page. */
export async function TrackBackNav() {
  const target = await resolveBackTarget();
  return (
    <Link
      href={target.href}
      className="text-sm font-semibold text-[var(--off-white)] underline-offset-2 hover:underline"
    >
      {target.label}
    </Link>
  );
}
