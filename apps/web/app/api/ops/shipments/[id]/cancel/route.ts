import { NextResponse } from "next/server";
import { cancelShipment } from "@/lib/data/ops-cancel";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await resolveOpsAccess(await readStaffSessionToken());
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const { id } = await context.params;
    const body = (await request.json()) as { reason?: unknown };
    const result = await cancelShipment(id, typeof body.reason === "string" ? body.reason : "");
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/ops/shipments/[id]/cancel/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not cancel the shipment." }, { status: 500 });
  }
}
