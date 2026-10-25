import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { ddpCharge } from "@/lib/data/ddp-charge";
import { quoteAmount } from "@/lib/data/payments";
import { getDraftShipmentForUser } from "@/lib/data/shipment-query";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

/** Customer: shipping, estimated duties and taxes (DDP), and the total to pay. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const { id } = await context.params;
    if (!(await getDraftShipmentForUser(user.id, id))) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
    const due = await quoteAmount(id);
    if (!due) return NextResponse.json({ error: "No price yet." }, { status: 404 });
    const ddp = await ddpCharge(id, due.currency);
    return NextResponse.json({
      currency: due.currency,
      shipping: due.shipping,
      duties: due.duties,
      total: due.amount,
      incoterm: ddp.incoterm,
      problem: "problem" in ddp ? ddp.problem : null,
    });
  } catch (error) {
    console.error("[bookings/[id]/price/route.ts:GET]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not load the price." }, { status: 500 });
  }
}
