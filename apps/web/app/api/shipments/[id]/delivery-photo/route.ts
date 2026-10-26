import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { writeAudit } from "@/lib/data/audit-log";
import { readDeliveryPhoto, saveDeliveryPhoto } from "@/lib/data/delivery-proof";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { getSql } from "@/lib/sql";
import { requestIp } from "@/lib/http/rate-limit";
import { readSessionToken } from "@/lib/http/session-cookie";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

async function isOwner(shipmentId: string): Promise<boolean> {
  const token = await readSessionToken();
  const user = token ? await getUserBySessionToken(token) : null;
  if (!user) return false;
  return Boolean(await (await getSql()).prepare(`SELECT 1 FROM shipments WHERE id = ? AND user_id = ?`).get(shipmentId, user.id));
}

/** Owner or staff: the delivery photo. Never public: tracking links can be forwarded. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const allowed = (await resolveOpsAccess(await readStaffSessionToken())).ok || (await isOwner(id));
    if (!allowed) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const photo = await readDeliveryPhoto(id);
    if (!photo) return NextResponse.json({ error: "No delivery photo." }, { status: 404 });
    return new NextResponse(new Uint8Array(photo.data), {
      headers: { "Content-Type": photo.type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'" },
    });
  } catch (error) {
    console.error("[shipments/[id]/delivery-photo/route.ts:GET]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not open the photo." }, { status: 500 });
  }
}

/** Ops: attach the delivery photo (JPG/PNG, 3 MB) after posting Delivered. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await resolveOpsAccess(await readStaffSessionToken());
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const { id } = await context.params;
    const file = (await request.formData()).get("photo");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo." }, { status: 400 });
    const saved = await saveDeliveryPhoto(id, file);
    if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });
    await writeAudit(access.staff, "shipment.pod_photo", id, null, requestIp(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[shipments/[id]/delivery-photo/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not save the photo." }, { status: 500 });
  }
}
