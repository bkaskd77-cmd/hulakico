import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/data/password-reset";
import { enforceRateLimit, requestIp } from "@/lib/http/rate-limit";

export const runtime = "nodejs";

const forgotSchema = z.object({ email: z.string().trim().email().max(120) });
const SENT = { ok: true, message: "If an account uses this email, a reset link is on its way." };

export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRateLimit("customer-forgot-ip", requestIp(request), 10, 60 * 60 * 1000);
    if ("retry" in ipLimit) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    const parsed = forgotSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    // Per-address limit stays silent so the reply never reveals whether the account exists.
    const emailLimit = await enforceRateLimit("customer-forgot-email", parsed.data.email.toLowerCase(), 3, 60 * 60 * 1000);
    if ("ok" in emailLimit) await requestPasswordReset(parsed.data.email);
    return NextResponse.json(SENT);
  } catch (error) {
    console.error("[forgot/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not send the reset link. Please try again." }, { status: 500 });
  }
}
