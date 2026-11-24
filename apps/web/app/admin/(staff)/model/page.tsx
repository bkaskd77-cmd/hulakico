import { loadModelHealth, TRAINING_TARGET, type ModelHealth } from "@/lib/data/model-health";
import { requireStaffPage } from "@/lib/http/require-staff";

export const runtime = "nodejs";

const CARD = "rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5";
const LABEL = "text-xs font-semibold uppercase tracking-wide text-[var(--teal)]";
const LEVEL_TEXT: Record<string, string> = { LOW: "Low risk", MEDIUM: "Medium risk", HIGH: "High risk" };

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className={CARD}>
      <p className={LABEL}>{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">{value}</p>
      {note ? <p className="mt-1 text-xs text-[var(--muted)]">{note}</p> : null}
    </div>
  );
}

function Readiness({ health }: { health: ModelHealth }) {
  const labelled = health.onTime + health.late;
  const share = Math.min(1, labelled / TRAINING_TARGET.labelled, health.late / TRAINING_TARGET.late);
  const ready = share >= 1;
  return (
    <section className={`mt-6 ${CARD}`}>
      <p className={LABEL}>Ready to train a learning model?</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--off-white)_12%,transparent)]">
        <div className="h-full bg-[var(--gold)]" style={{ width: `${Math.round(share * 100)}%` }} />
      </div>
      <p className="mt-3 text-sm text-[var(--off-white)]">
        {ready
          ? "Enough delivered shipments to train and test a model beside the current rules."
          : `${labelled} of ${TRAINING_TARGET.labelled} delivered shipments, ${health.late} of ${TRAINING_TARGET.late} late ones. Until then the rules score every shipment.`}
      </p>
    </section>
  );
}

export default async function ModelHealthPage() {
  await requireStaffPage("operations");
  let health: ModelHealth | null = null;
  let error: string | null = null;
  try {
    health = await loadModelHealth();
  } catch (err) {
    console.error("[admin/model/page.tsx]", err instanceof Error ? err.message : err);
    error = "Could not load model health. Try again in a moment.";
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)] sm:text-4xl">Model health</h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
        How well the delay-risk scores match what really happened, and how much data the system has collected to learn from.
      </p>
      {error ? <p className="mt-6 text-sm text-[var(--danger)]">{error}</p> : null}
      {health ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Shipments scored" value={health.shipmentsScored} note={`${health.predictions} scores in total`} />
            <Stat label="Delivered on time" value={health.onTime} />
            <Stat label="Delivered late" value={health.late} note="Returns to sender count as late" />
            <Stat label="Still moving" value={health.waiting} note={`${health.cancelled} cancelled`} />
          </div>
          <Readiness health={health} />
          <section className={`mt-6 ${CARD}`}>
            <p className={LABEL}>Did the score predict the delays?</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              First score of each delivered shipment. A good model shows few late deliveries at low risk and many at high risk.
            </p>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)]">
                  <th className="py-1 font-semibold">Predicted</th>
                  <th className="py-1 font-semibold">Delivered</th>
                  <th className="py-1 font-semibold">Late</th>
                  <th className="py-1 font-semibold">Late rate</th>
                </tr>
              </thead>
              <tbody>
                {health.levels.map((row) => (
                  <tr key={row.level} className="border-t border-[color-mix(in_srgb,var(--off-white)_10%,transparent)] text-[var(--off-white)]">
                    <td className="py-2">{LEVEL_TEXT[row.level] ?? row.level}</td>
                    <td className="py-2">{row.onTime + row.late}</td>
                    <td className="py-2">{row.late}</td>
                    <td className="py-2 font-semibold">{percent(row.late, row.onTime + row.late)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </div>
  );
}
