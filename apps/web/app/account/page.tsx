import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import {
  clearSessionCookie,
  readSessionToken,
} from "@/lib/http/session-cookie";
import { destroySession } from "@/lib/data/auth-store";

export const runtime = "nodejs";

async function signOutAction() {
  "use server";
  try {
    const token = await readSessionToken();
    if (token) {
      destroySession(token);
    }
    await clearSessionCookie();
  } catch (error) {
    console.error(
      "[account/page.tsx:signOutAction]",
      error instanceof Error ? error.message : error,
    );
  }
  redirect("/signin");
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ ops?: string }>;
}) {
  const token = await readSessionToken();
  if (!token) {
    redirect("/signin");
  }
  const user = getUserBySessionToken(token);
  if (!user) {
    redirect("/signin");
  }

  const params = await searchParams;
  const opsDenied = params.ops === "denied";

  return (
    <div className="shell-sky min-h-dvh px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-lg rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
          Welcome, {user.name}
        </p>
        {opsDenied ? (
          <p className="mt-3 text-sm text-[var(--danger)]">
            Ops tower is limited to Hulakico OPS/ADMIN accounts. Set
            OPS_BOOTSTRAP_EMAIL to your email in .env.local, restart the app,
            then sign in again.
          </p>
        ) : null}
        <dl className="mt-6 space-y-3 text-sm text-[var(--muted)]">
          <div>
            <dt className="text-xs uppercase tracking-wide">Email</dt>
            <dd className="text-[var(--off-white)]">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Account</dt>
            <dd className="text-[var(--off-white)]">{user.accountType}</dd>
          </div>
          {user.organization ? (
            <div>
              <dt className="text-xs uppercase tracking-wide">Organization</dt>
              <dd className="text-[var(--off-white)]">
                {user.organization.name} ({user.organization.role})
              </dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]"
          >
            Book a shipment
          </Link>
          <Link
            href="/ops"
            className="rounded-md bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-[var(--off-white)]"
          >
            Ops tower
          </Link>
          <Link
            href="/ops/carriers"
            className="rounded-md border border-[var(--teal)] px-4 py-2 text-sm font-semibold text-[var(--teal)]"
          >
            Carriers
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md border border-[var(--muted)] px-4 py-2 text-sm text-[var(--off-white)]"
            >
              Sign out
            </button>
          </form>
        </div>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-[var(--teal)] underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
