import { NextResponse } from "next/server";
import { signinSchema } from "@/lib/domain/auth";
import { authenticateUser } from "@/lib/data/auth-store";
import { setSessionCookie } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 400 },
      );
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
