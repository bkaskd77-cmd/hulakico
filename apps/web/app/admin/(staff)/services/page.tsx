import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ServicesEditor } from "@/app/admin/(staff)/services/ServicesEditor";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { getLaneCopies, saveLaneCopy } from "@/lib/data/lane-content";
import { getServices, saveServices, type ServiceItem } from "@/lib/data/services-content";
import { canAccess } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

const box =
  "mt-1.5 w-full resize-y rounded-md border border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] bg-[color-mix(in_srgb,var(--navy)_70%,transparent)] px-3 py-2.5 text-sm text-[var(--off-white)] outline-none focus:border-[var(--gold)]";

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

async function saveLaneAction(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug") ?? "");
  let flag = "error";
  try {
    const token = await readStaffSessionToken();
    const access = await resolveStaffAccess(token);
    if (!access.ok || !canAccess(access.staff.role, "content")) {
      flag = "denied";
    } else {
      const result = await saveLaneCopy({
        slug,
        title: "",
        to: "",
        summary: String(formData.get("summary") ?? ""),
        transit: String(formData.get("transit") ?? ""),
        paperwork: String(formData.get("paperwork") ?? ""),
        steps: String(formData.get("steps") ?? ""),
        story: String(formData.get("story") ?? ""),
      });
      if ("error" in result) flag = "error";
      else {
        flag = "saved";
        revalidatePath(`/services/international/${slug}`);
      }
    }
  } catch (error) {
    console.error("[services/page.tsx:saveLaneAction]", error instanceof Error ? error.message : error);
    flag = "error";
  }
  redirect(`/admin/services?lane=${encodeURIComponent(slug)}&saved=${flag}`);
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
  const selected = lanes.find((lane) => lane.slug === query.lane) ?? lanes[0];

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Site content</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--off-white)] sm:text-4xl">Services</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        Open a card to edit it. Add more services when you need them. Save updates the homepage, menus, and detail pages.
      </p>
      <ServicesEditor initial={items} saveAction={saveServicesAction} />
      {selected ? (
        <section className="mt-16 border-t border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] pt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">Destination pages</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
            Pick a lane and write as much as you need. Each box holds up to 100,000 characters. One step per line.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {lanes.map((lane) => (
              <Link
                key={lane.slug}
                href={`/admin/services?lane=${lane.slug}`}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${lane.slug === selected.slug ? "bg-[var(--gold)] text-[var(--navy)]" : "text-[var(--off-white)] ring-1 ring-[color-mix(in_srgb,var(--off-white)_25%,transparent)]"}`}
              >
                {lane.to}
              </Link>
            ))}
          </div>
          <form action={saveLaneAction} className="mt-6 max-w-3xl space-y-4">
            <input type="hidden" name="slug" value={selected.slug} />
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Lane brief<textarea name="summary" rows={6} defaultValue={selected.summary} className={box} /></label>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">How this lane moves<textarea name="transit" rows={8} defaultValue={selected.transit} className={box} /></label>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Receiver<textarea name="paperwork" rows={8} defaultValue={selected.paperwork} className={box} /></label>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Steps, one per line<textarea name="steps" rows={8} defaultValue={selected.steps} className={box} /></label>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Long article<textarea name="story" rows={16} defaultValue={selected.story} className={box} /></label>
            <button type="submit" className="rounded-md bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--navy)]">Save {selected.to}</button>
            {query.saved === "saved" ? <p className="text-sm text-[var(--teal)]">Saved. The public lane page now uses this writing.</p> : null}
            {query.saved === "error" || query.saved === "denied" ? <p className="text-sm text-[var(--danger)]">Could not save this destination page.</p> : null}
          </form>
        </section>
      ) : null}
    </>
  );
}
