import { NextResponse } from "next/server";
import { getStaffBySessionToken } from "@/lib/data/staff-auth";
import { checkStaffCode, staffHasTwoStep } from "@/lib/data/staff-totp";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

/** Staff (password-signed-in): confirm the first authenticator code to turn two-step login on. */
export async function POST(request: Request) {
  try {
    const token = await readStaffSessionToken();
    const staff = token ? await getStaffBySessionToken(token) : null;
    if (!staff) return NextResponse.json({ error: "Staff sign in required." }, { status: 401 });
    if (await staffHasTwoStep(staff.id)) return NextResponse.json({ ok: true });

    const limit = await enforceRateLimit("staff-two-step-setup", staff.id, 10, 15 * 60 * 1000);
    if ("retry" in limit) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

    const body = (await request.json()) as { code?: unknown };
    const code = typeof body.code === "string" ? body.code.slice(0, 12) : "";
    if (!(await checkStaffCode(staff.id, code, true))) {
      return NextResponse.json({ error: "That code is not right. Check the key in your app and try the newest code." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/two-step/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not turn on two-step login." }, { status: 500 });
  }
}
