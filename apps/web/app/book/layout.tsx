import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/app/home/PublicHeader";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { readSessionToken } from "@/lib/http/session-cookie";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Book a shipment · Hulakico", robots: { index: false, follow: false } };

export default async function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await readSessionToken();
  const user = token ? await getUserBySessionToken(token) : null;
  // Staff may open booking documents (e.g. the digital invoice) without a customer account.
  if (!user && !(await resolveOpsAccess(await readStaffSessionToken())).ok) {
    // Come straight back to booking after signing in.
    redirect("/signin?next=/book");
  }
  // Site header on every booking page, so customers can always get home or to their account.
  return (
    <>
      <div className="print:hidden">
        <PublicHeader signedIn />
      </div>
      {children}
    </>
  );
}
