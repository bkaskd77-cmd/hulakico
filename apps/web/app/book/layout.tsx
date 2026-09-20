import { redirect } from "next/navigation";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await readSessionToken();
  const user = token ? getUserBySessionToken(token) : null;
  if (!user) {
    redirect("/signin");
  }
  return children;
}
