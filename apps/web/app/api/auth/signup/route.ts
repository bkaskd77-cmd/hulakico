import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/domain/auth";
import { registerUser } from "@/lib/data/auth-store";
import { enforceRateLimit, requestIp } from "@/lib/http/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRateLimit("customer-signup", requestIp(request), 5, 60 * 60 * 1000);
    if ("retry" in ipLimit) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid signup details." }, { status: 400 });
    }

    const user = await registerUser(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error(
      "[signup/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    const message =
      error instanceof Error ? error.message : "Registration failed.";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
