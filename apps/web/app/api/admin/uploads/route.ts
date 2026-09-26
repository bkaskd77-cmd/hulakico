import { NextResponse } from "next/server";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { canAccess } from "@/lib/domain/staff-permissions";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";
import { uploadSiteImage } from "@/lib/storage/site-images";

export const runtime = "nodejs";

/** Website image upload for staff who can edit content (Admin, Editor). */
export async function POST(request: Request) {
  try {
    const access = await resolveStaffAccess(await readStaffSessionToken());
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    if (!canAccess(access.staff.role, "content")) {
      return NextResponse.json({ error: "Your staff role cannot edit website content." }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }

    const result = await uploadSiteImage(file);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ url: result.url }, { status: 201 });
  } catch (error) {
    console.error(
      "[api/admin/uploads/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
