import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPaymentIntent } from "@/lib/data/payments";
import { markPaymentPaid } from "@/lib/data/payment-wallet";
import { walletLabel } from "@/lib/payments/providers";

export const runtime = "nodejs";

async function paySuccessAction(formData: FormData) {
  "use server";
  const intentId = String(formData.get("intentId") || "");
  const result = await markPaymentPaid(intentId);
  if ("error" in result) {
    redirect(`/pay/stub/${intentId}?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/book/draft/${result.intent.shipmentId}?pay=paid`);
}

async function payCancelAction(formData: FormData) {
  "use server";
  const intentId = String(formData.get("intentId") || "");
  const intent = await getPaymentIntent(intentId);
  if (!intent) notFound();
  redirect(`/book/draft/${intent.shipmentId}?pay=cancel`);
}

export default async function StubCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ intentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { intentId } = await params;
  const { error } = await searchParams;
  const intent = await getPaymentIntent(intentId);
  if (!intent) notFound();

  if (intent.status === "PAID") {
    redirect(`/book/draft/${intent.shipmentId}?pay=paid`);
  }

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">Stub checkout</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
          {walletLabel(intent.provider)}
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Simulated gateway — no real charge. Live merchant APIs will replace this later.
        </p>
        <p className="mt-6 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[var(--gold)]">
          {intent.currency} {intent.amount.toFixed(2)}
        </p>
        {error ? <p className="mt-4 text-sm text-[var(--danger)]">{decodeURIComponent(error)}</p> : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <form action={paySuccessAction}>
            <input type="hidden" name="intentId" value={intent.id} />
            <button type="submit" className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--navy)]">
              Simulate success
            </button>
          </form>
          <form action={payCancelAction}>
            <input type="hidden" name="intentId" value={intent.id} />
            <button type="submit" className="rounded-md border border-[var(--teal)] px-4 py-2 text-sm text-[var(--teal)]">
              Cancel
            </button>
          </form>
        </div>
        <Link href={`/book/draft/${intent.shipmentId}`} className="mt-6 inline-block text-sm text-[var(--muted)] underline">
          Back without paying
        </Link>
      </div>
    </div>
  );
}
