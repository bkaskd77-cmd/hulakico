import { requestExceptionInfo } from "@/lib/data/exception-info";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await resolveOpsAccess(await readStaffSessionToken());
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const body = (await request.json()) as { infoRequestNote?: string };
    if (!body.infoRequestNote) {
      return NextResponse.json(
        { error: "infoRequestNote is required." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    await requestExceptionInfo(id, body.infoRequestNote);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[ops/exceptions/[id]/request-info/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    const message =
      error instanceof Error ? error.message : "Could not request info.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
