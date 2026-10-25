import { NextResponse } from "next/server";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { getMilestoneContext, postOpsMilestone } from "@/lib/data/ops-milestone";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

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
    const body = (await request.json()) as { status?: unknown; location?: unknown; note?: unknown };
    const text = (value: unknown) => (typeof value === "string" ? value : "");
    const result = await postOpsMilestone(id, text(body.status), { location: text(body.location), note: text(body.note) });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
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
