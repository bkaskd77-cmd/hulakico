import { NextResponse } from "next/server";
import { signinSchema } from "@/lib/domain/auth";
import { authenticateStaff } from "@/lib/data/staff-auth";
import { setStaffSessionCookie } from "@/lib/http/staff-session-cookie";

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

    const result = await authenticateStaff(
      parsed.data.email,
      parsed.data.password,
    );
    if (!result) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    await setStaffSessionCookie(result.sessionToken);
    return NextResponse.json({ staff: result.staff });
  } catch (error) {
    console.error(
      "[api/admin/auth/signin/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Staff sign in failed." }, { status: 500 });
  }
}
