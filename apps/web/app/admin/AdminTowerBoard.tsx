import Link from "next/link";
import {
  listAdminTowerShipments,
  type AdminTowerRow,
} from "@/lib/data/admin-tower";

function riskTone(level: AdminTowerRow["etaLevel"]): string {
  if (level === "HIGH") return "text-[var(--danger)]";
  if (level === "MEDIUM") return "text-[var(--gold)]";
  if (level === "LOW") return "text-[var(--teal)]";
  return "text-[var(--muted)]";
}

export async function AdminTowerBoard() {
  let rows: AdminTowerRow[] = [];
  let error: string | null = null;
  try {
    rows = await listAdminTowerShipments();
  } catch (err) {
    console.error(
      "[AdminTowerBoard.tsx]",
      err instanceof Error ? err.message : err,
    );
    error = "Could not load control tower. Is the intelligence service up?";
  }

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
        AI control tower
      </h1>
      <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
        Active shipments ranked by ETA risk, Hold/exception pressure, and
        pay-pending urgency.
      </p>

      {error ? <p className="mt-8 text-[var(--danger)]">{error}</p> : null}

      <ul className="mt-8 space-y-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--off-white)]">
                  {row.originCity} → {row.destinationCity}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {row.hulakicoAwb ?? "No AWB"} · {row.status} · {row.lane} ·{" "}
                  {row.customerEmail}
                </p>
                {row.etaFactors.length > 0 ? (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {row.etaFactors.join(" · ")}
                  </p>
                ) : null}
              </div>
              <div className="text-right text-xs">
                <p className={`font-semibold ${riskTone(row.etaLevel)}`}>
                  ETA {row.etaLevel} · {row.etaScore.toFixed(2)}
                </p>
                <p className="text-[var(--off-white)]">
                  Urgency {row.urgencyScore.toFixed(2)}
                </p>
                {row.onHold ? (
                  <p className="text-[var(--danger)]">Hold / exception</p>
                ) : null}
                {row.payPending ? (
                  <p className="text-[var(--gold)]">Pay pending</p>
                ) : null}
                <Link
                  href="/admin/shipments"
                  className="mt-1 inline-block text-[var(--teal)] underline"
                >
                  Open shipments
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 && !error ? (
        <p className="mt-8 text-sm text-[var(--muted)]">
          No active shipments to score.
        </p>
      ) : null}
    </>
  );
}
