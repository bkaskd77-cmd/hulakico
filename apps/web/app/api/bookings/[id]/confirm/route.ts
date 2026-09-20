import { NextResponse } from "next/server";
import { confirmShipmentBooking } from "@/lib/data/booking-confirm";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await readSessionToken();
    const user = token ? getUserBySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = (await request.json()) as { quoteOptionId?: string };
    if (!body.quoteOptionId) {
      return NextResponse.json(
        { error: "quoteOptionId is required." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const booked = await confirmShipmentBooking(
      user.id,
      id,
      body.quoteOptionId,
    );
    return NextResponse.json({ shipment: booked }, { status: 201 });
  } catch (error) {
    console.error(
      "[bookings/[id]/confirm/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    const message =
      error instanceof Error ? error.message : "Booking failed.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
