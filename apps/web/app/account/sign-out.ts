"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/data/auth-store";
import {
  clearSessionCookie,
  readSessionToken,
} from "@/lib/http/session-cookie";

export async function signOutAction() {
  try {
    const token = await readSessionToken();
    if (token) await destroySession(token);
    await clearSessionCookie();
  } catch (error) {
    console.error(
      "[account/sign-out.ts:signOutAction]",
      error instanceof Error ? error.message : error,
    );
  }
  redirect("/signin");
}
