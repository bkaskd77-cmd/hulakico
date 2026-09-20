import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RequestQuotesButton } from "@/app/book/RequestQuotesButton";
import { SelectQuoteButton } from "@/app/book/SelectQuoteButton";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { rankQuoteOptions } from "@/lib/data/intelligence-client";
import { getLatestQuoteOptions } from "@/lib/data/quote-query";
import { getDraftShipmentForUser } from "@/lib/data/shipments";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function DraftSavedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await readSessionToken();
  const user = token ? getUserBySessionToken(token) : null;
  if (!user) {
    redirect("/signin");
  }

  const { id } = await params;
  const shipment = getDraftShipmentForUser(user.id, id);
  if (!shipment) {
    notFound();
  }

  const baseQuotes = getLatestQuoteOptions(user.id, id);
  let quotes = baseQuotes.map((option, index) => ({
    ...option,
    rank: index + 1,
    rankScore: 0,
    rankReason: "Sorted by price (ranker unavailable)",
  }));
  let rankError: string | null = null;

  if (baseQuotes.length > 0) {
    try {
      quotes = await rankQuoteOptions({
        options: baseQuotes,
        wantsCod: shipment.wants_cod === 1,
      });
    } catch (error) {
      console.error(
        "[draft/[id]/page.tsx]",
        error instanceof Error ? error.message : error,
      );
      rankError = "Python ranker offline — showing price order.";
    }
  }

  const canBook =
    shipment.status === "QUOTED" || shipment.status === "DRAFT";

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">
          {shipment.status === "QUOTED" ? "AI-ranked quotes" : "Draft saved"}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
          Ranked carrier options
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {shipment.origin_city} → {shipment.destination_city} ({shipment.lane})
        </p>

        {rankError ? (
          <p className="mt-4 text-sm text-[var(--gold)]">{rankError}</p>
        ) : null}

        {quotes.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {quotes.map((option) => (
              <li
                key={option.id}
                className="rounded-md border border-[color-mix(in_srgb,var(--off-white)_12%,transparent)] px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--off-white)]">
                    #{option.rank} {option.carrierName}
                  </p>
                  <p className="text-xs text-[var(--teal)]">
                    score {option.rankScore.toFixed(3)}
                  </p>
                </div>
                <p className="text-[var(--muted)]">
                  {option.serviceName} · ETA {option.etaDaysMin}-
                  {option.etaDaysMax}d
                </p>
                <p className="mt-1 text-[var(--gold)]">
                  {option.currency} {option.amount.toFixed(2)}
                </p>
                {canBook ? (
                  <SelectQuoteButton
                    shipmentId={shipment.id}
                    quoteOptionId={option.id}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-[var(--muted)]">
            No quotes yet. Generate rates first.
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <RequestQuotesButton shipmentId={shipment.id} />
          <Link href="/book" className="text-sm text-[var(--teal)] underline">
            New draft
          </Link>
        </div>
      </div>
    </div>
  );
}
