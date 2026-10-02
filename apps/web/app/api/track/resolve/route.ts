import { NextResponse } from "next/server";
import { resolveTrackingQuery } from "@/lib/data/track-resolve";
import { enforceRateLimit, requestIp } from "@/lib/http/rate-limit";

export const runtime = "nodejs";

/** Public AWB/token → tracking_token (no extra fields leaked). */
export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRateLimit("track-resolve", requestIp(request), 12, 15 * 60 * 1000);
    if ("retry" in ipLimit) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const body = (await request.json()) as { query?: string };
    const result = await resolveTrackingQuery(String(body.query ?? ""));
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ token: result.token });
  } catch (error) {
    console.error(
      "[api/track/resolve/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Tracking lookup failed." },
      { status: 500 },
    );
  }
}
