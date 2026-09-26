import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { countStaff, registerStaff } from "@/lib/data/staff-register";
import { canAccess } from "@/lib/domain/staff-permissions";
import {
  readStaffSessionToken,
  setStaffSessionCookie,
} from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

const staffSignupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  role: z.enum(["ADMIN", "EDITOR", "SUB_ADMIN"]),
});

/** First account bootstraps an Admin; after that only a signed-in Admin can create staff. */
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

    const firstAccount = (await countStaff()) === 0;
    if (!firstAccount) {
      const creator = await resolveStaffAccess(await readStaffSessionToken());
      if (!creator.ok || !canAccess(creator.staff.role, "team")) {
        return NextResponse.json(
          { error: "Only an Admin can create staff accounts." },
          { status: 403 },
        );
      }
    }

    const result = await registerStaff({
      ...parsed.data,
      role: firstAccount ? "ADMIN" : parsed.data.role,
      startSession: firstAccount,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.sessionToken) await setStaffSessionCookie(result.sessionToken);
    return NextResponse.json(
      { staff: result.staff, signedIn: Boolean(result.sessionToken) },
      { status: 201 },
    );
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
