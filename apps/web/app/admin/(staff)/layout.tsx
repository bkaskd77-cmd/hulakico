import { redirect } from "next/navigation";
import { AdminNav } from "@/app/admin/AdminNav";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

export default async function AdminStaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await readStaffSessionToken();
  const access = resolveStaffAccess(token);

  if (!access.ok && access.status === 401) {
    redirect("/admin");
  }
  if (!access.ok) {
    redirect("/admin?denied=1");
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
              Signed in as {access.ok ? access.staff.email : "staff"} (
              {access.ok ? access.staff.role : "—"})
            </p>
          </div>
          <AdminNav />
        </div>
        {children}
      </div>
    </div>
  );
}
