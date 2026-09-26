import { NextResponse } from "next/server";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { updatePartnerTracking } from "@/lib/data/partner-awb";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

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
    const body = (await request.json()) as {
      partnerKey?: string;
      externalAwb?: string;
      trackUrl?: string;
    };
    const result = await updatePartnerTracking({
      shipmentId: id,
      partnerKey: body.partnerKey ?? "",
      externalAwb: body.externalAwb ?? "",
      trackUrl: body.trackUrl,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      externalAwb: result.externalAwb,
      partnerLabel: result.partnerLabel,
      partnerTrackUrl: result.partnerTrackUrl,
    });
  } catch (error) {
    console.error(
      "[api/ops/shipments/[id]/partner-awb/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Could not save partner tracking." },
      { status: 500 },
    );
  }
}
