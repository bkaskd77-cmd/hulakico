import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/lib/data/password-reset";
import { enforceRateLimit, requestIp } from "@/lib/http/rate-limit";

export const runtime = "nodejs";

const resetSchema = z.object({
  token: z.string().trim().min(20).max(100),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRateLimit("customer-reset-ip", requestIp(request), 10, 60 * 60 * 1000);
    if ("retry" in ipLimit) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    const parsed = resetSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Use a password of 8 to 72 characters." }, { status: 400 });
    const result = await resetPassword(parsed.data.token, parsed.data.password);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[reset/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not reset the password. Please try again." }, { status: 500 });
  }
}
