import { NextResponse } from "next/server";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { updatePartnerAwb } from "@/lib/data/partner-awb";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await readSessionToken();
    const access = resolveOpsAccess(token);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const { id } = await context.params;
    const body = (await request.json()) as { externalAwb?: string };
    const result = updatePartnerAwb(id, body.externalAwb ?? "");
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, externalAwb: result.externalAwb });
  } catch (error) {
    console.error(
      "[api/ops/shipments/[id]/partner-awb/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Could not save partner AWB." }, { status: 500 });
  }
}
