import { revalidatePath } from "next/cache";
import { ServicesEditor } from "@/app/admin/(staff)/services/ServicesEditor";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { getLaneCopies, saveLaneCopy, type LaneCopy } from "@/lib/data/lane-content";
import { getServices, saveServices, type ServiceItem } from "@/lib/data/services-content";
import { canAccess } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

async function saveServicesAction(items: ServiceItem[]): Promise<{ ok: true } | { error: string }> {
  "use server";
  try {
    const token = await readStaffSessionToken();
    const access = await resolveStaffAccess(token);
    if (!access.ok) return { error: "Staff sign in required." };
    if (!canAccess(access.staff.role, "content")) return { error: "Your staff role cannot edit website content." };
    const result = await saveServices(items);
    if ("error" in result) return result;
    revalidatePath("/");
    revalidatePath("/services", "layout");
    revalidatePath("/admin/services");
    return { ok: true };
  } catch (error) {
    console.error("[services/page.tsx:saveServicesAction]", error instanceof Error ? error.message : error);
    return { error: "Could not save services." };
  }
}

async function saveLaneAction(formData: FormData): Promise<{ ok: true } | { error: string }> {
  "use server";
  const slug = String(formData.get("slug") ?? "");
  try {
    const token = await readStaffSessionToken();
    const access = await resolveStaffAccess(token);
    if (!access.ok || !canAccess(access.staff.role, "content")) {
      return { error: "Your staff role cannot edit website content." };
    }
    let facts: LaneCopy["facts"] = [];
    try {
      const parsed = JSON.parse(String(formData.get("facts") ?? "[]"));
      facts = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("[services/page.tsx:saveLaneAction] facts", error instanceof Error ? error.message : error);
      return { error: "Could not read the lane facts." };
    }
    const result = await saveLaneCopy({
      slug,
      title: "",
      to: "",
      summary: String(formData.get("summary") ?? ""),
      transit: String(formData.get("transit") ?? ""),
      paperwork: String(formData.get("paperwork") ?? ""),
      steps: String(formData.get("steps") ?? ""),
      story: String(formData.get("story") ?? ""),
      handover: String(formData.get("handover") ?? ""),
      image: String(formData.get("image") ?? ""),
      defaultImage: "",
      facts,
    });
    if ("error" in result) return result;
    revalidatePath(`/services/international/${slug}`);
    return { ok: true };
  } catch (error) {
    console.error("[services/page.tsx:saveLaneAction]", error instanceof Error ? error.message : error);
    return { error: "Could not save this destination page." };
  }
}

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ lane?: string; saved?: string }>;
}) {
  await requireStaffPage("content");
  const query = await searchParams;
  const items = await getServices();
  const lanes = await getLaneCopies();

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Site content</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">Services</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Open a card to edit it. Add more services when you need them. Save updates the homepage, menus, and detail pages.
      </p>
      <ServicesEditor
        initial={items}
        saveAction={saveServicesAction}
        lanes={lanes}
        initialLane={query.lane}
        laneSaved={query.saved}
        saveLaneAction={saveLaneAction}
      />
    </>
  );
}
