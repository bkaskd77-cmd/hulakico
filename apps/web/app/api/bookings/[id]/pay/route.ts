import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getDb } from "@/lib/db";
import { createWalletPaymentIntent } from "@/lib/data/payment-wallet";
import { isWalletProvider } from "@/lib/payments/providers";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { id } = await context.params;
    const owned = getDb()
      .prepare(`SELECT id, status FROM shipments WHERE id = ? AND user_id = ?`)
      .get(id, user.id) as { id: string; status: string } | undefined;
    if (!owned) {
      return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
    }
    if (owned.status !== "DRAFT" && owned.status !== "QUOTED") {
      return NextResponse.json(
        { error: "Shipment is already booked." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as { provider?: string };
    if (!body.provider || !isWalletProvider(body.provider)) {
      return NextResponse.json(
        { error: "provider must be esewa, khalti, or connect_ips." },
        { status: 400 },
      );
    }

    const result = createWalletPaymentIntent(id, body.provider);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      intentId: result.intent.id,
      amount: result.intent.amount,
      currency: result.intent.currency,
      provider: result.intent.provider,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error) {
    console.error(
      "[bookings/[id]/pay/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Could not start payment." }, { status: 500 });
  }
}
