import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getInvoiceDocument } from "@/lib/data/invoice-document";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readSessionToken } from "@/lib/http/session-cookie";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";
import { InvoiceDocumentBody } from "./InvoiceDocumentBody";

export const runtime = "nodejs";

/** Digital commercial invoice — customer owner or staff authority. */
export default async function DigitalInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const customerToken = await readSessionToken();
  const staffToken = await readStaffSessionToken();
  const user = customerToken ? await getUserBySessionToken(customerToken) : null;
  const isAuthority = (await resolveOpsAccess(staffToken)).ok;
  if (!user && !isAuthority) redirect("/signin");

  const { id } = await params;
  await searchParams;
  const loaded = await getInvoiceDocument(user?.id ?? "staff", id, isAuthority);
  if ("error" in loaded) notFound();
  const { shipment: s, invoice } = loaded;
  const backHref =
    s.status === "DRAFT" || s.status === "QUOTED"
      ? `/book/draft/${s.id}`
      : `/account/shipments/${s.id}`;

  return (
    <div className="min-h-dvh bg-[var(--navy)] px-3 py-6 sm:px-4 sm:py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-3xl print:max-w-none">
        <div className="mb-4 flex flex-wrap gap-3 print:hidden">
          <Link href={backHref} className="text-sm text-[var(--teal)] underline">
            Back
          </Link>
          {invoice ? (
            <Link
              href={`/book/invoice/${s.id}?print=1`}
              className="text-sm text-[var(--gold)] underline"
            >
              Print
            </Link>
          ) : null}
        </div>
        {invoice ? (
          <InvoiceDocumentBody
            shipment={s}
            invoice={invoice}
            isAuthority={isAuthority}
          />
        ) : (
          <p className="rounded-lg bg-white/10 p-6 text-sm text-white">
            No commercial invoice has been saved for this shipment yet.
          </p>
        )}
      </div>
    </div>
  );
}
