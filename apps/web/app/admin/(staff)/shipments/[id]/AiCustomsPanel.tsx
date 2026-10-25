import { ApproveGoodsButton } from "@/app/admin/(staff)/shipments/[id]/ApproveGoodsButton";
import { latestCustomsCheck } from "@/lib/data/customs-ai";
import { getCustomsReview } from "@/lib/data/customs-review";
import { nepalTime } from "@/lib/domain/shipment-labels";

const TONE = { clear: "border-emerald-400/60", check: "border-amber-300/70", prohibited: "border-red-400/70" } as const;
const TITLE = { clear: "AI found no problems", check: "AI: documents or care needed", prohibited: "AI: goods may not be shippable" } as const;

/** Admin: the AI customs findings for this shipment and the staff decision on a prohibited flag. */
export async function AiCustomsPanel({ shipmentId }: { shipmentId: string }) {
  const check = await latestCustomsCheck(shipmentId);
  if (!check) return null;
  const review = await getCustomsReview(shipmentId);
  const approved = review && review.decided_at >= check.checkedAt;
  return (
    <section className={`mt-6 rounded-lg border bg-[var(--navy-elevated)] p-4 ${TONE[check.verdict]}`}>
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">{TITLE[check.verdict]}</h2>
      <p className="mt-1 text-sm text-[var(--off-white)]">{check.summary}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">Checked {nepalTime(check.checkedAt)} · advice only, staff decide</p>
      <ul className="mt-3 space-y-2 text-xs">
        {check.lines.map((line) => (
          <li key={line.index} className="border-t border-white/10 pt-2 text-[var(--off-white)]">
            <span className="font-semibold">Item {line.index + 1}</span> · HS <span className="font-mono">{line.suggestedHsCode}</span> ({line.hsTitle}) ·{" "}
            <span className={line.status === "ok" ? "text-emerald-300" : line.status === "restricted" ? "text-amber-200" : "text-red-300"}>{line.status}</span>
            {line.reason ? <span className="block text-[var(--muted)]">{line.reason}</span> : null}
            {line.documents.length ? <span className="block text-[var(--muted)]">Needs: {line.documents.join(", ")}</span> : null}
          </li>
        ))}
      </ul>
      {check.verdict === "prohibited" ? (
        approved ? (
          <p className="mt-3 text-xs font-semibold text-emerald-300">Approved by {review.staff_email} on {nepalTime(review.decided_at)}. The customer can pay.</p>
        ) : (
          <>
            <p className="mt-3 text-xs text-[var(--gold)]">Payment is on hold. Check the goods with the customer and the carrier, then approve, or cancel the shipment with a reason.</p>
            <ApproveGoodsButton shipmentId={shipmentId} />
          </>
        )
      ) : null}
    </section>
  );
}
