"use client";

/** Lane toggle + step progress for the booking wizard. */
export function BookWizardHeader({
  lane,
  step,
  rebookHint,
  onLane,
  wantsCod = false,
}: {
  lane: "DOMESTIC" | "INTERNATIONAL";
  step: 1 | 2 | 3 | 4;
  rebookHint?: string | null;
  onLane: (mode: "DOMESTIC" | "INTERNATIONAL") => void;
  wantsCod?: boolean;
}) {
  const step4 = wantsCod && lane === "DOMESTIC" ? "Book" : "Payment";
  const labels = ["Route", "Package", "Review", step4] as const;

  return (
    <>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">Hulakico booking</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
        Book a shipment
      </h1>
      {rebookHint ? <p className="mt-2 text-sm text-[var(--gold)]">{rebookHint}</p> : null}
      <div className="mt-5 flex gap-2">
        {(["DOMESTIC", "INTERNATIONAL"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onLane(mode)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              lane === mode
                ? "bg-[var(--gold)] text-[var(--navy)]"
                : "border border-[var(--teal)] text-[var(--teal)]"
            }`}
          >
            {mode === "DOMESTIC" ? "Nepal domestic" : "International"}
          </button>
        ))}
      </div>
      <ol className="mt-6 flex gap-2">
        {([1, 2, 3, 4] as const).map((n) => (
          <li
            key={n}
            className={`flex-1 rounded-md px-2 py-2 text-center text-xs font-semibold ${
              step === n
                ? "bg-[var(--teal)] text-[var(--off-white)]"
                : step > n
                  ? "bg-[color-mix(in_srgb,var(--teal)_35%,transparent)] text-[var(--off-white)]"
                  : "bg-[var(--navy)] text-[var(--muted)]"
            }`}
          >
            {n}. {labels[n - 1]}
          </li>
        ))}
      </ol>
    </>
  );
}
