import { NextResponse } from "next/server";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { getMilestoneContext, postOpsMilestone } from "@/lib/data/ops-milestone";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";
import { writeAudit } from "@/lib/data/audit-log";
import { requestIp } from "@/lib/http/rate-limit";
import { cleanReceiverName, recordReceiver } from "@/lib/data/delivery-proof";

export const runtime = "nodejs";

/** Ops: route context (from, to, last place) for suggesting the next update's location. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await resolveOpsAccess(await readStaffSessionToken());
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const { id } = await context.params;
    const result = await getMilestoneContext(id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/ops/shipments/[id]/milestone/route.ts:GET]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not load the shipment route." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await readStaffSessionToken();
    const access = await resolveOpsAccess(token);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const { id } = await context.params;
    const body = (await request.json()) as { status?: unknown; location?: unknown; note?: unknown; receivedBy?: unknown };
    const text = (value: unknown) => (typeof value === "string" ? value : "");
    // Proof of delivery: a delivery is only posted with the name of the person who received it.
    const receivedBy = cleanReceiverName(body.receivedBy);
    if (text(body.status) === "DELIVERED" && receivedBy.length < 2) {
      return NextResponse.json({ error: "Enter the name of the person who received the parcel." }, { status: 400 });
    }
    const result = await postOpsMilestone(id, text(body.status), { location: text(body.location), note: text(body.note) });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (result.status === "DELIVERED") await recordReceiver(id, receivedBy, access.staff.email);
    const where = [text(body.location), text(body.note), receivedBy ? `received by ${receivedBy}` : ""].filter(Boolean).join(" · ");
    await writeAudit(access.staff, "shipment.status", id, `${result.status}${where ? ` · ${where}` : ""}`, requestIp(request));
    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    console.error(
      "[api/ops/shipments/[id]/milestone/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Could not post Hulakico milestone." },
      { status: 500 },
    );
  }
}
