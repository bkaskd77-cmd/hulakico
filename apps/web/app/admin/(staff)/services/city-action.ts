"use server";

import { revalidatePath } from "next/cache";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { writeAudit } from "@/lib/data/audit-log";
import { getCityCopies, removeCityCopy, saveCityCopy } from "@/lib/data/city-content";
import type { LaneCopy } from "@/lib/data/lane-content";
import { canAccess } from "@/lib/domain/staff-permissions";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

/** Saves one domestic city page and keeps the editor on the same section. */
export async function saveCityAction(formData: FormData): Promise<{ ok: true } | { error: string }> {
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
      console.error("[city-action.ts:saveCityAction] facts", error instanceof Error ? error.message : error);
      return { error: "Could not read the city facts." };
    }
    const copies = formData.get("create") === "1" ? await getCityCopies() : [];
    if (copies.some((city) => city.slug === slug)) return { error: "That city is already on the list." };
    const result = await saveCityCopy({
      slug,
      title: String(formData.get("title") ?? ""),
      to: String(formData.get("to") ?? ""),
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
    await writeAudit(access.staff, "content.city", slug, formData.get("create") === "1" ? "added" : "edited");
    revalidatePath("/services/domestic");
    revalidatePath(`/services/domestic/${slug}`);
    return { ok: true };
  } catch (error) {
    console.error("[city-action.ts:saveCityAction]", error instanceof Error ? error.message : error);
    return { error: "Could not save this city page." };
  }
}

/** Removes a city page that staff added (not the built-in ones). */
export async function removeCityAction(slug: string): Promise<{ ok: true } | { error: string }> {
  try {
    const access = await resolveStaffAccess(await readStaffSessionToken());
    if (!access.ok || !canAccess(access.staff.role, "content")) return { error: "Your staff role cannot edit website content." };
    const result = await removeCityCopy(String(slug));
    if ("error" in result) return result;
    await writeAudit(access.staff, "content.city_remove", String(slug));
    revalidatePath("/services/domestic");
    revalidatePath(`/services/domestic/${slug}`);
    revalidatePath("/admin/services");
    return { ok: true };
  } catch (error) {
    console.error("[city-action.ts:removeCityAction]", error instanceof Error ? error.message : error);
    return { error: "Could not remove this city page." };
  }
}
