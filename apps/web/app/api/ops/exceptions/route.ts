import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { openException } from "@/lib/data/exceptions";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const token = await readSessionToken();
    const user = token ? getUserBySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
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

    const result = openException(user.id, body.shipmentId, body.reason);
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
