import { revalidatePath } from "next/cache";
import { ContactEditor } from "@/app/admin/(staff)/contact/ContactEditor";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { getContactSettings, saveContactSettings, type ContactSettings } from "@/lib/data/company-contact-content";
import { canAccess } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

async function saveContactAction(input: ContactSettings): Promise<{ ok: true } | { error: string }> {
  "use server";
  try {
    const token = await readStaffSessionToken();
    const access = await resolveStaffAccess(token);
    if (!access.ok) return { error: "Staff sign in required." };
    if (!canAccess(access.staff.role, "content")) return { error: "Your staff role cannot edit website content." };
    const result = await saveContactSettings(input);
    if ("error" in result) return result;
    // Contact details appear in the header, footer, and many pages.
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[contact/page.tsx:saveContactAction]", error instanceof Error ? error.message : error);
    return { error: "Could not save contact details." };
  }
}

export default async function AdminContactPage() {
  await requireStaffPage("content");
  const settings = await getContactSettings();
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Site content</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">Company contact</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Phones, email, WhatsApp, office address, and map link. Saved details are used across the website.
      </p>
      <ContactEditor initial={settings} saveAction={saveContactAction} />
    </>
  );
}
