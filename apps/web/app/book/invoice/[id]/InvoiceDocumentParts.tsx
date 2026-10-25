import { countryName } from "@/app/book/countries";
import type { InvoiceDocumentShipment } from "@/lib/data/invoice-document";
import { invoiceTotalWeightKg, type CommercialInvoice } from "@/lib/domain/invoice";
import { incotermDocumentLabel, invoiceTitle, purposeLabel } from "@/lib/domain/invoice-terms";
import { nepalDate } from "@/lib/domain/shipment-labels";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 py-1">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium">{value || "—"}</dd>
    </div>
  );
}

/** Title, number, date, AWB, purpose, and duty terms: what customs reads first. */
export function InvoiceHeader({ s, invoice }: { s: InvoiceDocumentShipment; invoice: CommercialInvoice }) {
  return (
    <header className="border-b border-neutral-200 pb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Hulakico Logistics · Thamel, Kathmandu, Nepal</p>
      <h1 className="mt-1 text-xl font-bold sm:text-2xl">{invoiceTitle(invoice.purpose)}</h1>
      <dl className="mt-3 grid gap-x-8 text-sm sm:grid-cols-2">
        <Row label="Invoice no." value={invoice.invoiceNumber} />
        <Row label="Invoice date" value={invoice.invoiceDate ? nepalDate(invoice.invoiceDate) : null} />
        <Row label="Air waybill (AWB)" value={s.hulakico_awb ?? "Issued at booking"} />
        <Row label="Reason for export" value={purposeLabel(invoice.purpose)} />
        <Row label="Incoterm" value={incotermDocumentLabel(invoice.incoterm)} />
        <Row label="Currency" value={invoice.currency} />
        <Row label="Exporter PAN / VAT" value={invoice.exporterTaxId} />
        <Row label="Importer tax / ID" value={invoice.importerTaxId} />
      </dl>
    </header>
  );
}

/** Goods value, charges, packages and weights, then the signed declaration. */
export function InvoiceTotalsAndDeclaration({ s, invoice }: { s: InvoiceDocumentShipment; invoice: CommercialInvoice }) {
  const total = invoice.totalValue + invoice.freightCharge + invoice.insuranceCharge;
  const money = (value: number) => `${invoice.currency} ${value.toFixed(2)}`;
  return (
    <>
      <dl className="ml-auto mt-6 max-w-sm text-sm">
        <Row label="Total goods value" value={money(invoice.totalValue)} />
        <Row label="Freight" value={money(invoice.freightCharge)} />
        <Row label="Insurance" value={money(invoice.insuranceCharge)} />
        <div className="flex justify-between gap-4 py-1.5 font-bold"><dt>Total invoice value</dt><dd>{money(total)}</dd></div>
        <Row label="Packages" value="1" />
        <Row label="Net weight (goods)" value={`${invoiceTotalWeightKg(invoice.lines).toFixed(3)} kg`} />
        <Row label="Gross weight (parcel)" value={`${Number(s.weight_kg).toFixed(3)} kg`} />
      </dl>
      {invoice.notes ? <p className="mt-6 text-sm text-neutral-600">Notes: {invoice.notes}</p> : null}
      <section className="mt-8 border-t border-neutral-200 pt-4 text-sm">
        <p className="font-semibold">Declaration</p>
        <p className="mt-1 text-neutral-700">
          I declare that the information on this invoice is true and correct, that the goods are as described, and that the
          values are the real prices paid or the fair value. The goods originate as stated.
        </p>
        <dl className="mt-4 grid gap-x-8 sm:grid-cols-3">
          <Row label="Name" value={invoice.declaredBy} />
          <Row label="Date" value={invoice.declaredAt ? nepalDate(invoice.declaredAt) : null} />
          <Row label="Place" value={`${s.origin_city}, ${countryName(s.origin_country)}`} />
        </dl>
        <p className="mt-6 text-neutral-500">Signature: ______________________________</p>
      </section>
    </>
  );
}
