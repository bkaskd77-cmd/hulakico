import { NextResponse } from "next/server";
import {
  ingestCarrierWebhook,
  type CarrierWebhookEvent,
} from "@/lib/data/carrier-webhook";

export const runtime = "nodejs";

/**
 * Partner push endpoint: POST { externalAwb, events[], secret? }
 * Protect with CARRIER_WEBHOOK_SECRET when set.
 */
export async function POST(request: Request) {
  try {
    const expected = process.env.CARRIER_WEBHOOK_SECRET?.trim();
    const body = (await request.json()) as {
      externalAwb?: string;
      events?: CarrierWebhookEvent[];
      secret?: string;
    };
    if (expected) {
      const header = request.headers.get("x-hulakico-webhook-secret")?.trim();
      const provided = header || body.secret?.trim();
      if (provided !== expected) {
        return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
      }
    }
    const result = await ingestCarrierWebhook(body.externalAwb ?? "", body.events ?? []);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "[api/webhooks/carrier/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Webhook failed." }, { status: 500 });
  }
}
