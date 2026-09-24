import { AdminNav } from "@/app/admin/AdminNav";
import { AdminTowerBoard } from "@/app/admin/AdminTowerBoard";
import { StaffSignInForm } from "@/app/admin/StaffSignInForm";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

export default async function AdminPlatformPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const params = await searchParams;
  const token = await readStaffSessionToken();
  const access = resolveStaffAccess(token);

  if (!access.ok) {
    return (
      <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
        <StaffSignInForm denied={params.denied === "1"} />
      </div>
    );
  }

  return (
    <div className="shell-sky min-h-dvh px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
              Hulakico Admin
            </p>
            <p className="text-sm text-[var(--muted)]">
              Signed in as {access.staff.email} ({access.staff.role})
            </p>
          </div>
          <AdminNav />
        </div>
        <AdminTowerBoard />
      </div>
    </div>
  );
}
