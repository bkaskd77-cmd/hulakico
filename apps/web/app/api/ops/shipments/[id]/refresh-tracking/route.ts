import { NextResponse } from "next/server";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { syncTrackingFromCarrier } from "@/lib/data/tracking-sync";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await readStaffSessionToken();
    const access = await resolveOpsAccess(token);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const { id } = await context.params;
    const result = await syncTrackingFromCarrier(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "[api/ops/shipments/[id]/refresh-tracking/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Tracking refresh failed." }, { status: 500 });
  }
}
