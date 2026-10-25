import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LabelSheet } from "@/app/label/[id]/LabelSheet";
import { PrintButton } from "@/app/label/[id]/PrintButton";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { getMyShipmentSummary, getStaffShipmentSummary } from "@/lib/data/shipment-summary";
import { readSessionToken } from "@/lib/http/session-cookie";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Parcel label · Hulakico", robots: { index: false, follow: false } };

/** Printable Hulakico parcel label for a booked shipment: the owner or staff. */
export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = (await resolveOpsAccess(await readStaffSessionToken())).ok;
  const token = await readSessionToken();
  const user = token ? await getUserBySessionToken(token) : null;
  if (!staff && !user) redirect("/signin");
  const loaded = staff ? await getStaffShipmentSummary(id) : await getMyShipmentSummary(user!.id, id);
  if ("error" in loaded) notFound();
  if (!loaded.hulakicoAwb) {
    return <p className="p-8 text-sm">The label is available once the shipment is booked and has a Hulakico AWB.</p>;
  }
  return (
    <div className="min-h-dvh bg-neutral-200 p-4 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[4in] items-center justify-between print:hidden">
        <p className="text-sm text-neutral-700">4×6 inch label. Print at 100% (no scaling).</p>
        <PrintButton />
      </div>
      <LabelSheet s={loaded} />
      <style>{`@page { size: 4in 6in; margin: 0.15in; } @media print { body { background: #fff; } }`}</style>
    </div>
  );
}
