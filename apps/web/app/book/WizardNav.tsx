import Link from "next/link";

const BTN =
  "rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]";
const OUTLINE =
  "rounded-md border border-[var(--teal)] px-4 py-2 text-sm text-[var(--teal)]";

/** Continue / Back / Cancel for the booking wizard steps. */
export function WizardNav({
  step,
  pending,
  onBack,
  onContinue,
  continueLabel = "Continue",
  hideContinue = false,
}: {
  step: 1 | 2 | 3 | 4;
  pending: boolean;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  hideContinue?: boolean;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {step > 1 ? (
        <button type="button" onClick={onBack} className={OUTLINE} disabled={pending}>
          Back
        </button>
      ) : null}
      {!hideContinue ? (
        <button
          type="button"
          onClick={onContinue}
          disabled={pending}
          className={`${BTN} disabled:opacity-60`}
        >
          {pending ? "Working…" : continueLabel}
        </button>
      ) : null}
      <Link href="/account" className={`${OUTLINE} ml-auto`}>
        Cancel
      </Link>
    </div>
  );
}
