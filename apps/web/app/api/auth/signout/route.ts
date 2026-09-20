import { NextResponse } from "next/server";
import { destroySession } from "@/lib/data/auth-store";
import {
  clearSessionCookie,
  readSessionToken,
} from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST() {
  try {
    const token = await readSessionToken();
    if (token) {
      destroySession(token);
    }
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[signout/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Sign out failed." }, { status: 500 });
  }
}
