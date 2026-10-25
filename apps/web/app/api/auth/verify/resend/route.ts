import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { sendEmailVerification } from "@/lib/data/email-verification";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

/** Signed-in customer: email a new verification link (3 per hour). */
export async function POST() {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const limit = await enforceRateLimit("customer-verify-resend", user.id, 3, 60 * 60 * 1000);
    if ("retry" in limit) return NextResponse.json({ error: "Too many links sent. Try again in an hour." }, { status: 429 });

    const sent = await sendEmailVerification(user.id);
    if ("error" in sent) return NextResponse.json({ error: sent.error }, { status: 500 });
    return NextResponse.json({ ok: true, message: `A new link is on its way to ${user.email}.` });
  } catch (error) {
    console.error("[verify/resend/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not send the verification email. Please try again later." }, { status: 500 });
  }
}
