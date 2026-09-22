import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getInvoiceDocument } from "@/lib/data/invoice-document";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { readSessionToken } from "@/lib/http/session-cookie";
import { InvoiceDocumentBody } from "./InvoiceDocumentBody";

export const runtime = "nodejs";

/** Digital commercial invoice — in-system for customer + OPS; printable for customs. */
export default async function DigitalInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const token = await readSessionToken();
  const user = token ? getUserBySessionToken(token) : null;
  if (!user) redirect("/signin");
  const { id } = await params;
  const { print } = await searchParams;
  const isAuthority = resolveOpsAccess(token).ok;
  const loaded = getInvoiceDocument(user.id, id, isAuthority);
  if ("error" in loaded) notFound();
  const { shipment: s, invoice } = loaded;
  const autoPrint = print === "1" && !!invoice;
  const backHref =
    s.status === "DRAFT" || s.status === "QUOTED"
      ? `/book/draft/${s.id}`
      : `/account/shipments/${s.id}`;

  return (
    <div className="min-h-dvh bg-[var(--navy)] px-3 py-6 sm:px-4 sm:py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 sm:gap-3 print:hidden">
        <p className="w-full text-xs uppercase tracking-[0.2em] text-[var(--teal)] sm:w-auto">
          Digital invoice document
        </p>
        <Link
          href={backHref}
          className="rounded-md border border-[var(--teal)] px-3 py-1.5 text-sm text-[var(--teal)]"
        >
          Back
        </Link>
        {invoice ? (
          <Link
            href={`/book/invoice/${s.id}?print=1`}
            className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-sm font-semibold text-[var(--navy)]"
          >
            Print document
          </Link>
        ) : null}
      </div>
      {!invoice ? (
        <p className="mx-auto mt-8 max-w-3xl text-sm text-[var(--muted)]">
          No invoice saved yet. Complete the commercial invoice on the draft, save, then open the digital document.
        </p>
      ) : (
        <InvoiceDocumentBody
          shipment={s}
          invoice={invoice}
          isAuthority={isAuthority}
        />
      )}
      {autoPrint ? (
        <script dangerouslySetInnerHTML={{ __html: "window.print();" }} />
      ) : null}
    </div>
  );
}
