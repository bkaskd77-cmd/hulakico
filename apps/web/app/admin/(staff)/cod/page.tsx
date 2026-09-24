import { CollectCodForm } from "@/app/ops/CollectCodForm";
import { listCodCollections } from "@/lib/data/cod";

export const runtime = "nodejs";

export default async function AdminCodPage() {
  let items: ReturnType<typeof listCodCollections> = [];
  let error: string | null = null;
  try {
    items = listCodCollections("PENDING_COLLECTION");
  } catch (err) {
    console.error(
      "[admin/cod/page.tsx]",
      err instanceof Error ? err.message : err,
    );
    error = "Could not load COD ledger.";
  }

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
        COD ledger
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Pending domestic cash-on-delivery collections.
      </p>
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
    </>
  );
}
