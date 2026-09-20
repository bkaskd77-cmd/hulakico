import { getUserBySessionToken, type PublicUser } from "@/lib/data/auth-store";
import { getDb } from "@/lib/db";

export type OpsGateResult =
  | { ok: true; user: PublicUser; platformRole: "OPS" | "ADMIN" }
  | { ok: false; status: 401 | 403; error: string };

export function resolveOpsAccess(sessionToken: string | null): OpsGateResult {
  try {
    if (!sessionToken) {
      return { ok: false, status: 401, error: "Sign in required." };
    }

    const user = getUserBySessionToken(sessionToken);
    if (!user) {
      return { ok: false, status: 401, error: "Sign in required." };
    }

    const row = getDb()
      .prepare(`SELECT platform_role FROM users WHERE id = ?`)
      .get(user.id) as { platform_role: string } | undefined;

    const role = row?.platform_role;
    if (role !== "OPS" && role !== "ADMIN") {
      return {
        ok: false,
        status: 403,
        error: "Ops access required. Set OPS_BOOTSTRAP_EMAIL to your account email.",
      };
    }

    return {
      ok: true,
      user,
      platformRole: role as "OPS" | "ADMIN",
    };
  } catch (error) {
    console.error(
      "[ops-guard.ts:resolveOpsAccess]",
      error instanceof Error ? error.message : error,
    );
    return { ok: false, status: 401, error: "Could not verify ops access." };
  }
}
