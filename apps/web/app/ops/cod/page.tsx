import Link from "next/link";
import { redirect } from "next/navigation";
import { CollectCodForm } from "@/app/ops/CollectCodForm";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { listCodCollections } from "@/lib/data/cod";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function OpsCodPage() {
  const token = await readSessionToken();
  if (!token || !(await getUserBySessionToken(token))) {
    redirect("/signin");
  }

  let items: Awaited<ReturnType<typeof listCodCollections>> = [];
  let error: string | null = null;
  try {
    items = await listCodCollections("PENDING_COLLECTION");
  } catch (err) {
    console.error("[ops/cod/page.tsx]", err instanceof Error ? err.message : err);
    error = "Could not load COD ledger.";
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
              COD ledger
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Pending domestic cash-on-delivery collections.
            </p>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="/ops" className="text-[var(--teal)] underline">
              Shipments
            </Link>
            <Link href="/ops/exceptions" className="text-[var(--gold)] underline">
              Exceptions
            </Link>
          </nav>
        </div>

        {error ? <p className="mt-8 text-[var(--danger)]">{error}</p> : null}

        <ul className="mt-8 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-4"
            >
              <p className="font-semibold text-[var(--off-white)]">{item.route}</p>
              <p className="text-xs text-[var(--muted)]">
                {item.hulakicoAwb ?? "No AWB"} · {item.currency}{" "}
                {item.amount.toFixed(2)} · {item.status}
              </p>
              <CollectCodForm codId={item.id} />
            </li>
          ))}
        </ul>
        {items.length === 0 && !error ? (
          <p className="mt-8 text-sm text-[var(--muted)]">
            No pending COD collections.
          </p>
        ) : null}
      </div>
    </div>
  );
}
