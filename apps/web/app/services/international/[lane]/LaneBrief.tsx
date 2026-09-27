import { getLaneCopy } from "@/lib/data/lane-content";
import type { ShippingLane } from "@/lib/domain/international-lanes";

const prose = "whitespace-pre-wrap text-sm leading-relaxed text-[var(--off-white)]/85";

function lines(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

/** Lane page chrome, with the writing loaded from the staff editor. */
export async function LaneBrief({ lane }: { lane: ShippingLane }) {
  const copy = await getLaneCopy(lane.slug);
  const summary = copy?.summary ?? lane.summary;
  const points = lines(copy?.transit ?? lane.transit);
  const paperwork = copy?.paperwork ?? lane.paperwork;
  const steps = lines(copy?.steps ?? "");
  const story = copy?.story?.trim() ?? "";
  const handover = copy?.handover?.trim() ?? "";
  const facts = (copy?.facts ?? []).filter((fact) => fact.label.trim() || fact.value.trim());
  const image = copy?.image ?? lane.image;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">Lane from Kathmandu</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight text-[var(--off-white)] sm:text-5xl">
        {lane.title}
      </h1>
      <div className="mt-6 flex items-center gap-3 text-sm font-semibold">
        <span className="rounded-full border border-[var(--gold)] px-3 py-1 text-[var(--gold)]">Kathmandu</span>
        <span className="h-px min-w-8 flex-1 bg-[color-mix(in_srgb,var(--gold)_55%,transparent)]" />
        <span className="rounded-full border border-[color-mix(in_srgb,var(--off-white)_35%,transparent)] px-3 py-1 text-[var(--off-white)]">
          {lane.to}
        </span>
      </div>

      <aside className="mt-8 border-l-4 border-[var(--gold)] bg-[var(--navy-elevated)] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">Lane brief</p>
        <p className={`mt-2 text-base text-[var(--off-white)] ${prose}`}>{summary}</p>
      </aside>

      {image ? (
        <figure className="mt-8 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-72 w-full object-cover object-center sm:h-96" />
          <figcaption className="bg-[var(--navy-elevated)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[var(--off-white)]/70">
            Handover starts in Kathmandu · delivery in {lane.to}
          </figcaption>
        </figure>
      ) : null}

      {points.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">How this lane moves</h2>
          <ul className="mt-4 space-y-3">
            {points.map((point, index) => (
              <li key={`${index}-${point.slice(0, 24)}`} className="flex gap-3 text-sm leading-relaxed text-[var(--off-white)]/85">
                <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />
                <span className="whitespace-pre-wrap">{point}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {facts.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">Lane facts</h2>
          <dl className="mt-4 border-y border-[color-mix(in_srgb,var(--off-white)_14%,transparent)]">
            {facts.map((fact, index) => (
              <div key={`${fact.label}-${index}`} className="grid gap-1 border-b border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] py-3 last:border-b-0 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6">
                <dt className="text-sm font-semibold text-[var(--gold)]">{fact.label}</dt>
                <dd className={prose}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">Handover</p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">Kathmandu</h3>
          <p className={`mt-3 ${prose}`}>{handover}</p>
        </section>
        <section className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] bg-[var(--navy-elevated)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Receiver</p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--off-white)]">{lane.to}</h3>
          <p className={`mt-3 ${prose}`}>{paperwork}</p>
        </section>
      </div>

      {steps.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">How to send on this lane</h2>
          <ol className="mt-4 space-y-4">
            {steps.map((step, index) => (
              <li key={`${index}-${step.slice(0, 24)}`} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-sm font-bold text-[var(--navy)]">
                  {index + 1}
                </span>
                <p className={`pt-1 ${prose}`}>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {story ? (
        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">On this lane</h2>
          <div className={`mt-4 ${prose}`}>{story}</div>
        </section>
      ) : null}
    </div>
  );
}
