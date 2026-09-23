import { NextResponse } from "next/server";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { postOpsMilestone } from "@/lib/data/ops-milestone";
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
    const body = (await request.json()) as { status?: string };
    const result = postOpsMilestone(id, body.status ?? "");
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
