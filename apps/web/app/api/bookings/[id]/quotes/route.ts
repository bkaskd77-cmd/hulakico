import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { rankQuoteOptions } from "@/lib/data/intelligence-client";
import { generateQuotesForShipment } from "@/lib/data/quotes";
import { getDraftShipmentForUser } from "@/lib/data/shipments";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await readSessionToken();
    const user = token ? getUserBySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { id } = await context.params;
    const result = generateQuotesForShipment(user.id, id);
    const shipment = getDraftShipmentForUser(user.id, id);
    const ranked = await rankQuoteOptions({
      options: result.options,
      wantsCod: shipment?.wants_cod === 1,
    });

    return NextResponse.json({
      quoteId: result.quoteId,
      shipmentId: result.shipmentId,
      options: ranked,
    });
  } catch (error) {
    console.error(
      "[bookings/[id]/quotes/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    const message =
      error instanceof Error ? error.message : "Quote generation failed.";
    const status = message.includes("not found")
      ? 404
      : message.includes("intelligence")
        ? 503
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
