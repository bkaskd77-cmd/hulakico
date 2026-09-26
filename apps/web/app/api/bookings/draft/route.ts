import { NextResponse } from "next/server";
import { draftBookingSchema } from "@/lib/domain/booking";
import { createDraftShipment } from "@/lib/data/shipments";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = draftBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking details.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const draft = await createDraftShipment(
      user.id,
      user.organization?.id ?? null,
      parsed.data,
    );
    return NextResponse.json({ shipment: draft }, { status: 201 });
  } catch (error) {
    console.error(
      "[bookings/draft/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Could not save draft shipment." },
      { status: 500 },
    );
  }
}
