import Link from "next/link";
import { RequestInfoForm } from "@/app/ops/RequestInfoForm";
import { ResolveExceptionForm } from "@/app/ops/ResolveExceptionForm";
import { listExceptions } from "@/lib/data/exception-query";

export const runtime = "nodejs";

export default async function OpsExceptionsPage() {
  let exceptions: ReturnType<typeof listExceptions> = [];
  let error: string | null = null;
  try {
    exceptions = listExceptions("ACTIVE");
  } catch (err) {
    console.error(
      "[ops/exceptions/page.tsx]",
      err instanceof Error ? err.message : err,
    );
    error = "Could not load exceptions.";
  }

  return (
    <div className="shell-sky min-h-dvh px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">
              Ops control tower
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
              Open exceptions
            </h1>
          </div>
          <Link href="/ops" className="text-sm text-[var(--teal)] underline">
            Shipments
          </Link>
        </div>

        {error ? <p className="mt-8 text-[var(--danger)]">{error}</p> : null}

        <ul className="mt-8 space-y-3">
          {exceptions.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[var(--off-white)]">
                  {item.route}
                </p>
                <span className="rounded bg-[color-mix(in_srgb,var(--gold)_22%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--gold)]">
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                {item.hulakicoAwb ?? "No AWB"} · was {item.previousStatus}
              </p>
              <p className="mt-2 text-sm text-[var(--off-white)]">{item.reason}</p>
              {item.infoRequestNote ? (
                <p className="mt-2 text-sm text-[var(--gold)]">
                  Asked customer: {item.infoRequestNote}
                </p>
              ) : null}
              {item.status === "OPEN" ? (
                <RequestInfoForm exceptionId={item.id} />
              ) : null}
              <ResolveExceptionForm exceptionId={item.id} />
            </li>
          ))}
        </ul>
        {exceptions.length === 0 && !error ? (
          <p className="mt-8 text-sm text-[var(--muted)]">No open exceptions.</p>
        ) : null}
      </div>
    </div>
  );
}
