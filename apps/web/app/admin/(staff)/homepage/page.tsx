import { revalidatePath } from "next/cache";
import { HomepageEditor } from "@/app/admin/(staff)/homepage/HomepageEditor";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import {
  getHomepageContent,
  saveHomepageContent,
  type HomepageContent,
} from "@/lib/data/homepage-content";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

async function saveHomepageAction(
  content: HomepageContent,
): Promise<{ ok: true } | { error: string }> {
  "use server";
  try {
    const token = await readStaffSessionToken();
    const access = resolveStaffAccess(token);
    if (!access.ok) return { error: "Staff sign in required." };
    const result = saveHomepageContent(content);
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
  const content = getHomepageContent();
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
        Site content
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">
        Homepage
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Edit one section at a time. Save publishes to the public landing page at{" "}
        <span className="text-[var(--off-white)]">/</span>.
      </p>
      <HomepageEditor initial={content} saveAction={saveHomepageAction} />
    </>
  );
}
