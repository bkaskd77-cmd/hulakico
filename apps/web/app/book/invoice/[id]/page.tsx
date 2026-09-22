import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { countryName } from "@/app/book/countries";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import {
  getInvoiceDocument,
  type InvoiceDocumentShipment,
} from "@/lib/data/invoice-document";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import {
  invoiceTotalUnits,
  invoiceTotalWeightKg,
  type CommercialInvoice,
} from "@/lib/domain/invoice";
import { readSessionToken } from "@/lib/http/session-cookie";

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

  return (
    <div className="min-h-dvh bg-[var(--navy)] px-4 py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 print:hidden">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">Digital invoice document</p>
        <Link href={`/book/draft/${s.id}`} className="rounded-md border border-[var(--teal)] px-3 py-1.5 text-sm text-[var(--teal)]">Back to draft</Link>
        {invoice ? (
          <Link href={`/book/invoice/${s.id}?print=1`} className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-sm font-semibold text-[var(--navy)]">Print document</Link>
        ) : null}
      </div>
      {!invoice ? (
        <p className="mx-auto mt-8 max-w-3xl text-sm text-[var(--muted)]">
          No invoice saved yet. Complete the commercial invoice on the draft, save, then open the digital document.
        </p>
      ) : (
        <InvoiceArticle shipment={s} invoice={invoice} isAuthority={isAuthority} />
      )}
      {autoPrint ? <script dangerouslySetInnerHTML={{ __html: "window.print();" }} /> : null}
    </div>
  );
}

function InvoiceArticle({
  shipment: s,
  invoice,
  isAuthority,
}: {
  shipment: InvoiceDocumentShipment;
  invoice: CommercialInvoice;
  isAuthority: boolean;
}) {
  return (
    <article className="mx-auto mt-6 max-w-3xl rounded-lg bg-white p-8 text-neutral-900 shadow print:mt-0 print:rounded-none print:p-6 print:shadow-none">
      <header className="border-b border-neutral-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Hulakico digital invoice</p>
        <h1 className="mt-1 text-2xl font-bold">Commercial Invoice</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Document {invoice.id} · Shipment {s.id}{s.hulakico_awb ? ` · AWB ${s.hulakico_awb}` : ""}
        </p>
        <p className="text-sm text-neutral-600">
          Export reason: {invoice.exportReason} · {invoice.currency} · Status {s.status}
          {isAuthority ? " · Authority / OPS view" : ""}
        </p>
      </header>
      <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
        <Party side="Shipper / Exporter" name={s.origin_contact_name} company={s.origin_company}
          line1={s.origin_line1} line2={s.origin_line2} city={s.origin_city}
          postal={s.origin_postal_code} country={s.origin_country} phone={s.origin_phone}
          email={s.origin_email} fallback={s.origin_address} />
        <Party side="Consignee / Importer" name={s.destination_contact_name} company={s.destination_company}
          line1={s.destination_line1} line2={s.destination_line2} city={s.destination_city}
          postal={s.destination_postal_code} country={s.destination_country} phone={s.destination_phone}
          email={s.destination_email} fallback={s.destination_address} />
      </div>
      <table className="mt-8 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-xs uppercase text-neutral-500">
            <th className="py-2 pr-2">Description</th>
            <th className="py-2 pr-2">HS</th>
            <th className="py-2 pr-2">Origin</th>
            <th className="py-2 pr-2">Qty</th>
            <th className="py-2 pr-2">Unit</th>
            <th className="py-2 pr-2">Wt kg</th>
            <th className="py-2 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id} className="border-b border-neutral-100 align-top">
              <td className="py-2 pr-2">{line.description}</td>
              <td className="py-2 pr-2">{line.hsCode || "—"}</td>
              <td className="py-2 pr-2">{line.countryOfOrigin ? countryName(line.countryOfOrigin) : "—"}</td>
              <td className="py-2 pr-2">{line.quantity}</td>
              <td className="py-2 pr-2">{line.unit}</td>
              <td className="py-2 pr-2">{line.weightKg != null ? (line.quantity * line.weightKg).toFixed(3) : "—"}</td>
              <td className="py-2 text-right">{invoice.currency} {line.lineTotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 flex flex-wrap justify-end gap-6 text-sm">
        <p>Total units: {invoiceTotalUnits(invoice.lines)}</p>
        <p>Total weight: {invoiceTotalWeightKg(invoice.lines).toFixed(3)} kg</p>
        <p className="font-bold">Total value: {invoice.currency} {invoice.totalValue.toFixed(2)}</p>
      </div>
      {invoice.notes ? <p className="mt-6 text-sm text-neutral-600">Notes: {invoice.notes}</p> : null}
      <p className="mt-8 text-xs text-neutral-500">
        Hulakico digital invoice for customs/authority review. Cite document ID {invoice.id}.
      </p>
    </article>
  );
}

function Party(p: {
  side: string; name: string | null; company: string | null; line1: string | null;
  line2: string | null; city: string; postal: string | null; country: string;
  phone: string | null; email: string | null; fallback: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{p.side}</p>
      <p className="mt-1 font-semibold">{p.name || "—"}</p>
      {p.company ? <p>{p.company}</p> : null}
      <p>{p.line1 || p.fallback}</p>
      {p.line2 ? <p>{p.line2}</p> : null}
      <p>{p.city}{p.postal ? ` ${p.postal}` : ""} · {countryName(p.country)}</p>
      {p.phone ? <p>Tel: {p.phone}</p> : null}
      {p.email ? <p>{p.email}</p> : null}
    </div>
  );
}
