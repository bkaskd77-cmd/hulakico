import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ingestCarrierWebhook,
  type CarrierWebhookEvent,
} from "@/lib/data/carrier-webhook";

export const runtime = "nodejs";

function secretMatches(provided: string, expected: string): boolean {
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

/** Partner push. Refuses every call until CARRIER_WEBHOOK_SECRET is set. */
export async function POST(request: Request) {
  try {
    const expected = process.env.CARRIER_WEBHOOK_SECRET?.trim();
    if (!expected) {
      console.error("[api/webhooks/carrier/route.ts:POST] CARRIER_WEBHOOK_SECRET is not set.");
      return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
    }
    const body = (await request.json()) as {
      externalAwb?: string;
      events?: CarrierWebhookEvent[];
      secret?: string;
    };
    const provided = request.headers.get("x-hulakico-webhook-secret")?.trim() || body.secret?.trim() || "";
    if (!secretMatches(provided, expected)) {
      return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
    }
    const events = Array.isArray(body.events) ? body.events.slice(0, 20) : [];
    const result = await ingestCarrierWebhook(body.externalAwb ?? "", events);
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
