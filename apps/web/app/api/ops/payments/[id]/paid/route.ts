import { NextResponse } from "next/server";
import { markTransferPaid } from "@/lib/data/payment-ops";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

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

    const { id } = await context.params;
    const body = (await request.json()) as { note?: string };
    const result = await markTransferPaid(id, body.note ?? "");
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[api/ops/payments/[id]/paid/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Mark paid failed." }, { status: 500 });
  }
}
