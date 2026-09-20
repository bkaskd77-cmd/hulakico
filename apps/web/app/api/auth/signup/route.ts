import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/domain/auth";
import { registerUser } from "@/lib/data/auth-store";
import { setSessionCookie } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid signup details.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await registerUser(parsed.data);
    await setSessionCookie(result.sessionToken);
    return NextResponse.json({ user: result.user }, { status: 201 });
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
