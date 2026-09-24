import { NextResponse } from "next/server";
import { z } from "zod";
import { registerStaff } from "@/lib/data/staff-register";
import { setStaffSessionCookie } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

const staffSignupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  role: z.enum(["ADMIN", "EDITOR", "SUB_ADMIN"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = staffSignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid staff signup details." },
        { status: 400 },
      );
    }

    const result = await registerStaff(parsed.data);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await setStaffSessionCookie(result.sessionToken);
    return NextResponse.json({ staff: result.staff }, { status: 201 });
  } catch (error) {
    console.error(
      "[api/admin/auth/signup/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Staff signup failed." },
      { status: 500 },
    );
  }
}
