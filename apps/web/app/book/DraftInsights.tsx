type EtaRisk = {
  level: string;
  score: number;
  factors: string[];
};

type DocQc = {
  severity: string;
  warnings: Array<{ code: string; message: string }>;
};

export function DraftInsights({
  etaRisk,
  docQc,
  insightError,
}: {
  etaRisk: EtaRisk | null;
  docQc: DocQc | null;
  insightError: string | null;
}) {
  return (
    <>
      {insightError ? (
        <p className="mt-4 text-sm text-[var(--gold)]">{insightError}</p>
      ) : null}

      {etaRisk ? (
        <div className="mt-4 rounded-md border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] p-3 text-sm">
          <p className="font-semibold text-[var(--off-white)]">
            ETA risk: {etaRisk.level} ({etaRisk.score.toFixed(2)})
          </p>
          <ul className="mt-2 list-disc pl-4 text-[var(--muted)]">
            {etaRisk.factors.map((factor) => (
              <li key={factor}>{factor}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {docQc ? (
        <div className="mt-4 rounded-md border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] p-3 text-sm">
          <p className="font-semibold text-[var(--off-white)]">
            Document QC: {docQc.severity}
          </p>
          {docQc.warnings.length === 0 ? (
            <p className="mt-2 text-[var(--muted)]">No document issues detected.</p>
          ) : (
            <ul className="mt-2 list-disc pl-4 text-[var(--muted)]">
              {docQc.warnings.map((warning) => (
                <li key={warning.code}>{warning.message}</li>
              ))}
            </ul>
          )}
          {docQc.severity === "BLOCKER" ? (
            <p className="mt-2 text-xs text-[var(--danger)]">
              Fix blockers before booking.
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
