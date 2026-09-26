import { revalidatePath } from "next/cache";
import { PagesEditor } from "@/app/admin/(staff)/pages/PagesEditor";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { getPages, savePages, type SitePage } from "@/lib/data/pages-content";
import { canAccess } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

async function savePagesAction(items: SitePage[]): Promise<{ ok: true } | { error: string }> {
  "use server";
  try {
    const token = await readStaffSessionToken();
    const access = await resolveStaffAccess(token);
    if (!access.ok) return { error: "Staff sign in required." };
    if (!canAccess(access.staff.role, "content")) {
      return { error: "Your staff role cannot edit website content." };
    }
    const result = await savePages(items);
    if ("error" in result) return result;
    for (const item of items) {
      if (!item.standalone) revalidatePath(`/${item.slug}`);
    }
    revalidatePath("/admin/pages");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[pages/page.tsx:savePagesAction]", error instanceof Error ? error.message : error);
    return { error: "Could not save pages." };
  }
}

export default async function AdminPagesPage() {
  await requireStaffPage("content");
  const items = await getPages();
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Site content</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">
        Pages
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Open a card to edit About, Help, Terms, Privacy, or a new page. The footer group decides where the link sits.
      </p>
      <PagesEditor initial={items} saveAction={savePagesAction} />
    </>
  );
}
