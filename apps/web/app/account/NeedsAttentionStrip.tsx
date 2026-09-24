import Link from "next/link";
import type { AttentionItem } from "@/lib/data/shipment-attention";

function tone(kind: AttentionItem["kind"]): string {
  if (kind === "HOLD") return "border-red-200 bg-red-50";
  if (kind === "INFO") return "border-amber-200 bg-amber-50";
  return "border-sky-200 bg-sky-50";
}

/** Banner of Hold / info / pay items that need the customer. */
export function NeedsAttentionStrip({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-6 rounded-lg border border-[var(--teal)]/40 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
          Needs your attention
        </h2>
        <p className="text-xs font-semibold text-[var(--teal)]">{items.length} open</p>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={`${item.kind}-${item.shipmentId}`} className={`rounded-md border px-3 py-3 ${tone(item.kind)}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                  {item.awb ? ` · ${item.awb}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">{item.routeLabel}</p>
                <p className="mt-1 text-sm text-slate-800">{item.detail}</p>
              </div>
              <Link
                href={item.href}
                className="shrink-0 rounded-md bg-[var(--navy)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                {item.kind === "PAY" ? "Open settle" : "Open"}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
