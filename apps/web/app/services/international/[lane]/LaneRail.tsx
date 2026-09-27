import Link from "next/link";
import { QuoteLink } from "@/app/home/QuoteLink";
import { COMPANY_CONTACT } from "@/lib/data/info-pages";
import type { ShippingLane } from "@/lib/domain/international-lanes";

const action =
  "block rounded-md px-4 py-3 text-center text-sm font-semibold transition";

/** Quote desk and the other lanes, kept beside the lane story. */
export function LaneRail({
  lane,
  others,
  hrefBase = "/services/international",
  fromLabel = "Nepal",
  blurb = "Share the city, the weight, and the contents. The desk compares partners and confirms a window before you book.",
  listTitle = "Other lanes",
}: {
  lane: ShippingLane;
  others: ShippingLane[];
  hrefBase?: string;
  fromLabel?: string;
  blurb?: string;
  listTitle?: string;
}) {
  const phone = COMPANY_CONTACT.phones[0];

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--gold)_45%,transparent)] bg-[var(--navy-elevated)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Lane desk</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
          Quote {lane.to}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--off-white)]/85">{blurb}</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <a href={COMPANY_CONTACT.whatsappHref} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_20%,transparent)] px-2 py-2 text-center text-xs font-semibold text-[var(--off-white)] hover:border-[var(--teal)]">
            WhatsApp
          </a>
          <a href={phone?.href ?? "#"} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_20%,transparent)] px-2 py-2 text-center text-xs font-semibold text-[var(--off-white)] hover:border-[var(--teal)]">
            Call
          </a>
          <a href={`mailto:${COMPANY_CONTACT.email}`} className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_20%,transparent)] px-2 py-2 text-center text-xs font-semibold text-[var(--off-white)] hover:border-[var(--teal)]">
            Email
          </a>
        </div>
        <QuoteLink className={`${action} mt-4 bg-[var(--gold)] text-[var(--navy)] hover:brightness-110`}>
          Get a Quote
        </QuoteLink>
        <Link href="/book" className={`${action} mt-2 border border-[var(--off-white)] text-[var(--off-white)] hover:bg-[color-mix(in_srgb,var(--off-white)_12%,transparent)]`}>
          Book a shipment
        </Link>
      </div>

      <div className="rounded-xl border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">{listTitle}</h2>
        <ul className="mt-3 space-y-1">
          {others.map((item) => (
            <li key={item.slug}>
              <Link
                href={`${hrefBase}/${item.slug}`}
                className="block rounded-md px-2 py-2 text-sm text-[var(--off-white)]/90 hover:bg-[color-mix(in_srgb,var(--off-white)_8%,transparent)] hover:text-[var(--gold)]"
              >
                {fromLabel} → {item.to}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
