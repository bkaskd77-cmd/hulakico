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
}: {
  step: 1 | 2 | 3;
  pending: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {step > 1 ? (
        <button type="button" onClick={onBack} className={OUTLINE}>
          Back
        </button>
      ) : null}
      {step < 3 ? (
        <button type="button" onClick={onContinue} className={BTN}>
          Continue
        </button>
      ) : (
        <button type="submit" disabled={pending} className={`${BTN} disabled:opacity-60`}>
          {pending ? "Saving…" : "Save draft & get quotes"}
        </button>
      )}
      <Link href="/account" className={`${OUTLINE} ml-auto`}>
        Cancel
      </Link>
    </div>
  );
}
