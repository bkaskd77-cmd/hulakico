import { revalidatePath } from "next/cache";
import { ServicesEditor } from "@/app/admin/(staff)/services/ServicesEditor";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { getServices, saveServices, type ServiceItem } from "@/lib/data/services-content";
import { canAccess } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

async function saveServicesAction(
  items: ServiceItem[],
): Promise<{ ok: true } | { error: string }> {
  "use server";
  try {
    const token = await readStaffSessionToken();
    const access = await resolveStaffAccess(token);
    if (!access.ok) return { error: "Staff sign in required." };
    if (!canAccess(access.staff.role, "content")) {
      return { error: "Your staff role cannot edit website content." };
    }
    const result = await saveServices(items);
    if ("error" in result) return result;
    revalidatePath("/");
    revalidatePath("/services", "layout");
    revalidatePath("/admin/services");
    return { ok: true };
  } catch (error) {
    console.error(
      "[services/page.tsx:saveServicesAction]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not save services." };
  }
}

export default async function AdminServicesPage() {
  await requireStaffPage("content");
  const items = await getServices();
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
        Site content
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">
        Services
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Edit cards and detail pages. Add, remove, or reorder. Nothing goes live on the public site until the next wiring step — Save stores the catalogue now.
      </p>
      <ServicesEditor initial={items} saveAction={saveServicesAction} />
    </>
  );
}
