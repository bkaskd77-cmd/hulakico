import { redirect } from "next/navigation";
import { AdminIdentity } from "@/app/admin/AdminIdentity";
import { AdminNav } from "@/app/admin/AdminNav";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { canAccess, ROLE_LABELS } from "@/lib/domain/staff-permissions";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

export default async function AdminStaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await readStaffSessionToken();
  const access = await resolveStaffAccess(token);

  if (!access.ok && access.status === 401) {
    redirect("/admin");
  }
  if (!access.ok) {
    redirect("/admin?denied=1");
  }

  return (
    <div className="shell-sky min-h-dvh px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[color-mix(in_srgb,var(--off-white)_18%,transparent)] pb-6">
          <AdminIdentity
            name={access.staff.name}
            email={access.staff.email}
            roleLabel={ROLE_LABELS[access.staff.role]}
            showTeamLink={canAccess(access.staff.role, "team")}
          />
          <AdminNav role={access.staff.role} />
        </div>
        {children}
      </div>
    </div>
  );
}
