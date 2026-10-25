import { cookies } from "next/headers";

export const STAFF_SESSION_COOKIE = "hulakico_staff_session";

/**
 * Admin cookie: no maxAge, so it is a browser-session cookie (gone when the browser
 * closes); the server session itself ends after STAFF_SESSION_HOURS. "strict" keeps the
 * cookie off requests that start on another site.
 */
export async function setStaffSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(STAFF_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearStaffSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(STAFF_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function readStaffSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(STAFF_SESSION_COOKIE)?.value ?? null;
}
