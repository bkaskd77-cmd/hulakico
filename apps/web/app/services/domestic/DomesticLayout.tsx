import { LaneBoard } from "@/app/services/international/LaneBoard";
import { getCityCopies } from "@/lib/data/city-content";
import type { ShippingLane } from "@/lib/domain/international-lanes";

const panelClass =
  "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-5";

function asCity(copy: { slug: string; to: string; title: string; summary: string; image: string; defaultImage: string; transit: string; paperwork: string }): ShippingLane {
  return { slug: copy.slug, to: copy.to, title: copy.title, summary: copy.summary, image: copy.image || copy.defaultImage, transit: copy.transit, paperwork: copy.paperwork };
}

/** City cards on the left. Existing domestic service facts stay stacked on the right. */
export async function DomesticLayout({
  highlights,
  needs,
  howItWorks,
}: {
  highlights: string[];
  needs: string[];
  howItWorks: string[];
}) {
  const cities = (await getCityCopies()).map(asCity);
  return (
    <section className="mx-auto grid max-w-[78rem] gap-8 px-6 py-16 sm:px-12 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.72fr)]">
      <LaneBoard
        lanes={cities}
        hrefBase="/services/domestic"
        eyebrow="Cities across Nepal"
        intro="Open a city for the timing, the address we need, and how the box moves from Kathmandu."
        fromLabel="Kathmandu"
        linkLabel="View city →"
      />
      <aside className="space-y-4">
        {highlights.map((item) => (
          <div key={item} className={panelClass}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--teal)_24%,transparent)] text-sm font-bold text-[var(--gold)]">✓</span>
            <p className="mt-3 text-sm leading-relaxed text-[var(--off-white)]/90">{item}</p>
          </div>
        ))}
        <div className={panelClass}>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">What you need</h2>
          <ul className="mt-4 space-y-3">
            {needs.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-[var(--off-white)]/85">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className={panelClass}>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">How it works</h2>
          <ol className="mt-4 space-y-3">
            {howItWorks.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-[var(--off-white)]/85">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--teal)] text-xs font-bold text-[var(--teal)]">{index + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </section>
  );
}
