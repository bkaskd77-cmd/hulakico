import { NextResponse } from "next/server";
import { resolveException } from "@/lib/data/exceptions";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = resolveOpsAccess(await readStaffSessionToken());
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const body = (await request.json()) as { resolutionNote?: string };
    if (!body.resolutionNote) {
      return NextResponse.json(
        { error: "resolutionNote is required." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    resolveException(id, body.resolutionNote);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[ops/exceptions/[id]/resolve/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    const message =
      error instanceof Error ? error.message : "Could not resolve exception.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
