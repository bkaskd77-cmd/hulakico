import { countryName } from "@/app/book/countries";
import type { InvoiceDocumentShipment } from "@/lib/data/invoice-document";
import {
  invoiceTotalUnits,
  invoiceTotalWeightKg,
  type CommercialInvoice,
} from "@/lib/domain/invoice";

/** Printable digital invoice body — stacked lines on mobile, table on larger / print. */
export function InvoiceDocumentBody({
  shipment: s,
  invoice,
  isAuthority,
}: {
  shipment: InvoiceDocumentShipment;
  invoice: CommercialInvoice;
  isAuthority: boolean;
}) {
  return (
    <article className="mx-auto mt-6 max-w-3xl rounded-lg bg-white p-4 text-neutral-900 shadow sm:p-8 print:mt-0 print:rounded-none print:p-6 print:shadow-none">
      <header className="border-b border-neutral-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Hulakico digital invoice</p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">Commercial Invoice</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Hulakico AWB:{" "}
          <span className="break-all font-semibold">{s.hulakico_awb ?? "Pending"}</span>
        </p>
        <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
          Export reason: {invoice.exportReason} · {invoice.currency} · {s.status.replaceAll("_", " ")}
          {isAuthority ? " · Ops view" : ""}
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

      <ul className="mt-8 space-y-3 sm:hidden print:hidden">
        {invoice.lines.map((line) => (
          <li key={line.id} className="rounded-md border border-neutral-200 p-3 text-sm">
            <p className="font-semibold">{line.description}</p>
            <p className="mt-1 text-xs text-neutral-600">
              HS {line.hsCode || "—"} · Origin{" "}
              {line.countryOfOrigin ? countryName(line.countryOfOrigin) : "—"}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              Qty {line.quantity} {line.unit} · Wt{" "}
              {line.weightKg != null ? `${(line.quantity * line.weightKg).toFixed(3)} kg` : "—"}
            </p>
            <p className="mt-2 font-semibold">{invoice.currency} {line.lineTotal.toFixed(2)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 hidden overflow-x-auto sm:block print:block">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
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
                <td className="whitespace-nowrap py-2 text-right">{invoice.currency} {line.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:justify-end sm:gap-6">
        <p>Total units: {invoiceTotalUnits(invoice.lines)}</p>
        <p>Total weight: {invoiceTotalWeightKg(invoice.lines).toFixed(3)} kg</p>
        <p className="font-bold">Total value: {invoice.currency} {invoice.totalValue.toFixed(2)}</p>
      </div>
      {invoice.notes ? <p className="mt-6 text-sm text-neutral-600">Notes: {invoice.notes}</p> : null}
      <p className="mt-8 text-xs text-neutral-500">
        Hulakico commercial invoice for customs / authority review.
        {s.hulakico_awb ? ` Reference AWB ${s.hulakico_awb}.` : ""}
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
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{p.side}</p>
      <p className="mt-1 font-semibold">{p.name || "—"}</p>
      {p.company ? <p>{p.company}</p> : null}
      <p className="break-words">{p.line1 || p.fallback}</p>
      {p.line2 ? <p className="break-words">{p.line2}</p> : null}
      <p>{p.city}{p.postal ? ` ${p.postal}` : ""} · {countryName(p.country)}</p>
      {p.phone ? <p>Tel: {p.phone}</p> : null}
      {p.email ? <p className="break-all">{p.email}</p> : null}
    </div>
  );
}
