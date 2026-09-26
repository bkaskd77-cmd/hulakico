import { revalidatePath } from "next/cache";
import { HomepageEditor } from "@/app/admin/(staff)/homepage/HomepageEditor";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import {
  getHomepageContent,
  saveHomepageContent,
  type HomepageContent,
} from "@/lib/data/homepage-content";
import { canAccess } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

async function saveHomepageAction(
  content: HomepageContent,
): Promise<{ ok: true } | { error: string }> {
  "use server";
  try {
    const token = await readStaffSessionToken();
    const access = await resolveStaffAccess(token);
    if (!access.ok) return { error: "Staff sign in required." };
    if (!canAccess(access.staff.role, "content")) {
      return { error: "Your staff role cannot edit website content." };
    }
    const result = await saveHomepageContent(content);
    if ("error" in result) return result;
    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return { ok: true };
  } catch (error) {
    console.error(
      "[homepage/page.tsx:saveHomepageAction]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not save homepage." };
  }
}

export default async function AdminHomepagePage() {
  await requireStaffPage("content");
  const content = await getHomepageContent();
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
        Site content
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">
        Homepage
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Reorder, hide, add, remove, and replace photos. Nothing goes live until you click Save.
      </p>
      <HomepageEditor initial={content} saveAction={saveHomepageAction} />
    </>
  );
}
