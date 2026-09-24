import { cookies } from "next/headers";

export const STAFF_SESSION_COOKIE = "hulakico_staff_session";

export async function setStaffSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(STAFF_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearStaffSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(STAFF_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function readStaffSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(STAFF_SESSION_COOKIE)?.value ?? null;
}
