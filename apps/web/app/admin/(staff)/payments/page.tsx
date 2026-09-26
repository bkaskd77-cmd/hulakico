import { MarkPaidForm } from "@/app/ops/MarkPaidForm";
import { listAwaitingTransferPayments } from "@/lib/data/payment-ops";
import { requireStaffPage } from "@/lib/http/require-staff";

export const runtime = "nodejs";

export default async function AdminPaymentsPage() {
  await requireStaffPage("operations");
  let items: Awaited<ReturnType<typeof listAwaitingTransferPayments>> = [];
  let error: string | null = null;
  try {
    items = await listAwaitingTransferPayments();
  } catch (err) {
    console.error(
      "[admin/payments/page.tsx]",
      err instanceof Error ? err.message : err,
    );
    error = "Could not load awaiting payments.";
  }

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
        Transfer payments
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Awaiting bank-transfer freight payments (stub provider).
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
              {item.amount.toFixed(2)} · awaiting
            </p>
            <MarkPaidForm paymentId={item.id} />
          </li>
        ))}
      </ul>
      {items.length === 0 && !error ? (
        <p className="mt-8 text-sm text-[var(--muted)]">
          No awaiting transfer payments.
        </p>
      ) : null}
    </>
  );
}
