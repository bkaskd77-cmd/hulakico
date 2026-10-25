import { countryName } from "@/app/book/countries";
import type { ShipmentParty, ShipmentSummary } from "@/lib/data/shipment-summary";
import { code128Bars } from "@/lib/domain/code128";
import { codeLabel, customerPartnerAwb, laneLabel, nepalDate } from "@/lib/domain/shipment-labels";

function Barcode({ value }: { value: string }) {
  const code = code128Bars(value);
  if (!code) return <p className="font-mono text-lg font-bold">{value}</p>;
  return (
    <svg viewBox={`0 0 ${code.width} 60`} preserveAspectRatio="none" className="h-20 w-full" role="img" aria-label={`Barcode ${value}`}>
      <rect width={code.width} height="60" fill="#fff" />
      {code.bars.map((bar) => <rect key={bar.x} x={bar.x} y="0" width={bar.w} height="60" fill="#000" />)}
    </svg>
  );
}

function Party({ title, party, large }: { title: string; party: ShipmentParty; large?: boolean }) {
  return (
    <div className="border-b-2 border-black p-2">
      <p className="text-[10px] font-bold uppercase tracking-wide">{title}</p>
      <p className={`${large ? "text-lg" : "text-sm"} font-bold leading-tight`}>{party.contactName || "—"}</p>
      {party.company && party.company !== party.contactName ? <p className="text-xs leading-tight">{party.company}</p> : null}
      <p className={`${large ? "text-sm" : "text-xs"} leading-tight`}>{[party.line1, party.line2].filter(Boolean).join(", ")}</p>
      <p className={`${large ? "text-base font-bold" : "text-xs font-semibold"} leading-tight`}>
        {[party.city, party.postalCode].filter(Boolean).join(" ")} · {countryName(party.country)}
      </p>
      {party.phone ? <p className="text-xs leading-tight">Tel {party.phone}</p> : null}
    </div>
  );
}

/** 4×6 inch Hulakico parcel label: AWB barcode, sender, receiver, service, and what the desk must act on. */
export function LabelSheet({ s }: { s: ShipmentSummary }) {
  const awb = s.hulakicoAwb ?? s.id;
  const partnerAwb = customerPartnerAwb(s.externalAwb);
  const codDue = s.settle.mode === "COD" && s.settle.status === "PENDING_COLLECTION"
    ? (s.settle.amount ? `${s.settle.currency} ${s.settle.amount.toFixed(2)}` : "See booking") : null;
  const terms = s.lane === "INTERNATIONAL" && s.invoice ? (s.invoice.incoterm === "DDP" ? "DDP · duties paid by sender" : "DAP · receiver pays duties") : null;
  return (
    <article className="label-sheet mx-auto flex w-[4in] flex-col border-2 border-black bg-white text-black">
      <header className="flex items-center justify-between border-b-2 border-black p-2">
        <div>
          <p className="text-base font-black leading-none tracking-tight">HULAKICO LOGISTICS</p>
          <p className="text-[10px] leading-tight">Thamel, Kathmandu · hulakico.com</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black leading-none">{codeLabel(s.serviceClass).toUpperCase()}</p>
          <p className="text-[10px] font-semibold">{laneLabel(s.lane)}</p>
        </div>
      </header>
      <div className="border-b-2 border-black px-2 pb-1 pt-2">
        <Barcode value={awb} />
        <p className="text-center font-mono text-base font-bold tracking-wider">{awb}</p>
      </div>
      <Party title="Ship to" party={s.destination} large />
      <Party title="From" party={s.origin} />
      <div className="grid grid-cols-3 border-b-2 border-black text-center text-xs">
        <div className="border-r-2 border-black p-1.5"><p className="text-[10px] uppercase">Weight</p><p className="font-bold">{s.chargeableKg} kg</p></div>
        <div className="border-r-2 border-black p-1.5"><p className="text-[10px] uppercase">Pieces</p><p className="font-bold">1 of 1</p></div>
        <div className="p-1.5"><p className="text-[10px] uppercase">Date</p><p className="font-bold">{nepalDate(s.createdAt)}</p></div>
      </div>
      {codDue ? (
        <div className="border-b-2 border-black bg-black p-2 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-widest">Cash on delivery — collect</p>
          <p className="text-2xl font-black">{codDue}</p>
        </div>
      ) : null}
      <div className="space-y-0.5 p-2 text-xs">
        <p><span className="font-bold">Contents:</span> {s.contents || codeLabel(s.packageType)}</p>
        {terms ? <p><span className="font-bold">Duties:</span> {terms}</p> : null}
        {partnerAwb ? <p><span className="font-bold">Partner:</span> {s.partnerLabel ?? s.carrierName ?? "Courier"} · {partnerAwb}</p> : null}
        <p className="pt-1 text-[10px]">Track: hulakico.com/track · AWB {awb}</p>
      </div>
    </article>
  );
}
