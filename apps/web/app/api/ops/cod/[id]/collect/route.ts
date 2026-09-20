import { NextResponse } from "next/server";
import { markCodCollected } from "@/lib/data/cod";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = resolveOpsAccess(await readSessionToken());
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const { id } = await context.params;
    const body = (await request.json()) as { note?: string };
    const result = markCodCollected(id, body.note ?? "");
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[api/ops/cod/[id]/collect/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Collect failed." }, { status: 500 });
  }
}
