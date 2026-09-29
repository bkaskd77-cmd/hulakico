import { revalidatePath } from "next/cache";
import { NotesEditor } from "@/app/admin/(staff)/notes/NotesEditor";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { getPublishedNotes, saveDeskNotes, type StoredNote } from "@/lib/data/desk-notes-content";
import { canAccess } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

async function saveNotesAction(items: StoredNote[]): Promise<{ ok: true } | { error: string }> {
  "use server";
  try {
    const token = await readStaffSessionToken();
    const access = await resolveStaffAccess(token);
    if (!access.ok) return { error: "Staff sign in required." };
    if (!canAccess(access.staff.role, "content")) return { error: "Your staff role cannot edit website content." };
    const result = await saveDeskNotes(items);
    if ("error" in result) return result;
    revalidatePath("/");
    revalidatePath("/notes");
    for (const item of items) revalidatePath(`/notes/${item.slug}`);
    revalidatePath("/admin/notes");
    return { ok: true };
  } catch (error) {
    console.error("[notes/page.tsx:saveNotesAction]", error instanceof Error ? error.message : error);
    return { error: "Could not save notes." };
  }
}

export default async function AdminNotesPage() {
  await requireStaffPage("content");
  const notes = await getPublishedNotes();
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Site content</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">Desk notes</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Add, edit, reorder, or remove a note. Upload a cover and a second photo. The story box holds 1000 words and more.
      </p>
      <NotesEditor initial={notes} saveAction={saveNotesAction} />
    </>
  );
}
