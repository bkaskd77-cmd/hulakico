import { NextResponse } from "next/server";
import { signinSchema } from "@/lib/domain/auth";
import { authenticateStaff, updateStaffName } from "@/lib/data/staff-auth";
import { writeAudit } from "@/lib/data/audit-log";
import { enforceRateLimit, requestIp } from "@/lib/http/rate-limit";
import { setStaffSessionCookie } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRateLimit("staff-signin", requestIp(request), 5, 15 * 60 * 1000);
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

    const emailLimit = await enforceRateLimit("staff-signin-email", parsed.data.email.toLowerCase(), 5, 15 * 60 * 1000);
    if ("retry" in emailLimit) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const result = await authenticateStaff(
      parsed.data.email,
      parsed.data.password,
      typeof body?.code === "string" ? body.code.slice(0, 12) : "",
    );
    if (!result) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }
    if ("codeProblem" in result) {
      if (result.codeProblem === "wrong") {
        await writeAudit({ id: null, email: parsed.data.email.toLowerCase() }, "staff.signin.wrong_code", null, null, requestIp(request));
      }
      const error = result.codeProblem === "missing"
        ? "Enter the 6-digit code from your authenticator app."
        : "That code is not right or was already used. Wait for a new code and try again.";
      return NextResponse.json({ error, needsCode: true }, { status: 401 });
    }

    const holderName = typeof body?.name === "string" ? body.name : "";
    if (holderName.trim()) {
      try {
        await updateStaffName(result.staff.id, holderName);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save the admin name.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
      result.staff.name = holderName.trim().replace(/\s+/g, " ");
    }

    await setStaffSessionCookie(result.sessionToken);
    await writeAudit(result.staff, "staff.signin", null, null, requestIp(request));
    return NextResponse.json({ staff: result.staff });
  } catch (error) {
    console.error(
      "[api/admin/auth/signin/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Staff sign in failed." }, { status: 500 });
  }
}
