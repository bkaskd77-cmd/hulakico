import { NextResponse } from "next/server";
import { signinSchema } from "@/lib/domain/auth";
import { authenticateStaff, updateStaffName } from "@/lib/data/staff-auth";
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
    return NextResponse.json({ staff: result.staff });
  } catch (error) {
    console.error(
      "[api/admin/auth/signin/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Staff sign in failed." }, { status: 500 });
  }
}
