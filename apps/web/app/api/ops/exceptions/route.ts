import { NextResponse } from "next/server";
import { openException } from "@/lib/data/exceptions";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const access = await resolveOpsAccess(await readStaffSessionToken());
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const body = (await request.json()) as {
      shipmentId?: string;
      reason?: string;
    };
    if (!body.shipmentId || !body.reason) {
      return NextResponse.json(
        { error: "shipmentId and reason are required." },
        { status: 400 },
      );
    }

    const result = await openException(access.staff.id, body.shipmentId, body.reason);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(
      "[ops/exceptions/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    const message =
      error instanceof Error ? error.message : "Could not open exception.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
