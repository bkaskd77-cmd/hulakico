import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/data/audit-log";
import { approveCustomsReview } from "@/lib/data/customs-review";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { requestIp } from "@/lib/http/rate-limit";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

/** Ops: approve goods the AI flagged as prohibited, releasing the payment hold. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await resolveOpsAccess(await readStaffSessionToken());
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const { id } = await context.params;
    const result = await approveCustomsReview(id, access.staff.email);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
    await writeAudit(access.staff, "customs.approve", id, "Goods approved after AI flag", requestIp(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ops/shipments/[id]/customs-review/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not save the review." }, { status: 500 });
  }
}
