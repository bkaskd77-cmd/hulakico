import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function GET() {
  try {
    const token = await readSessionToken();
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    const user = getUserBySessionToken(token);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error(
      "[me/route.ts:GET]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Session lookup failed." }, { status: 500 });
  }
}
