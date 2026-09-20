import { redirect } from "next/navigation";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await readSessionToken();
  const access = resolveOpsAccess(token);

  if (!access.ok && access.status === 401) {
    redirect("/signin");
  }
  if (!access.ok) {
    redirect("/account?ops=denied");
  }

  return children;
}
