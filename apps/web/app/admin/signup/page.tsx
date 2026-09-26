import Link from "next/link";
import { StaffSignupForm } from "@/app/admin/signup/StaffSignupForm";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { countStaff } from "@/lib/data/staff-register";
import { canAccess } from "@/lib/domain/staff-permissions";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminSignupPage() {
  const firstAccount = (await countStaff()) === 0;
  const access = firstAccount ? null : await resolveStaffAccess(await readStaffSessionToken());
  const isAdmin = Boolean(access?.ok && canAccess(access.staff.role, "team"));

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      {firstAccount || isAdmin ? (
        <StaffSignupForm mode={firstAccount ? "first" : "admin"} />
      ) : (
        <div className="w-full max-w-md rounded-lg border border-[color-mix(in_srgb,var(--gold)_28%,transparent)] bg-[var(--navy-elevated)] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Hulakico Admin</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
            Staff accounts are created by an Admin
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Ask a Hulakico Admin to create your account. They will share your sign-in details.
          </p>
          <Link href="/admin" className="mt-6 block w-full rounded-md bg-[var(--gold)] px-4 py-3 text-center text-sm font-semibold text-[var(--navy)]">
            Staff sign in
          </Link>
        </div>
      )}
    </div>
  );
}
