import { NextResponse } from "next/server";
import { cancelShipment } from "@/lib/data/ops-cancel";
import { writeAudit } from "@/lib/data/audit-log";
import { requestIp } from "@/lib/http/rate-limit";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await resolveOpsAccess(await readStaffSessionToken());
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const { id } = await context.params;
    const body = (await request.json()) as { reason?: unknown };
    const reason = typeof body.reason === "string" ? body.reason : "";
    const result = await cancelShipment(id, reason);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    await writeAudit(access.staff, "shipment.cancel", id, reason, requestIp(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/ops/shipments/[id]/cancel/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not cancel the shipment." }, { status: 500 });
  }
}
