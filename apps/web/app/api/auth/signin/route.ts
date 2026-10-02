import { NextResponse } from "next/server";
import { signinSchema } from "@/lib/domain/auth";
import { authenticateUser } from "@/lib/data/auth-store";
import { enforceRateLimit, requestIp } from "@/lib/http/rate-limit";
import { setSessionCookie } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRateLimit("customer-signin", requestIp(request), 8, 15 * 60 * 1000);
    if ("retry" in ipLimit) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const body = await request.json();
    const parsed = signinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 400 },
      );
    }

    const emailLimit = await enforceRateLimit("customer-signin-email", parsed.data.email.toLowerCase(), 8, 15 * 60 * 1000);
    if ("retry" in emailLimit) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const result = await authenticateUser(
      parsed.data.email,
      parsed.data.password,
    );
    if (!result) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    await setSessionCookie(result.sessionToken);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error(
      "[signin/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Sign in failed." }, { status: 500 });
  }
}
