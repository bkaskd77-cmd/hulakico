import { getSql } from "@/lib/sql";
import { runOnce } from "@/lib/sql/once";
import { latestCustomsCheck } from "@/lib/data/customs-ai";

type Review = { decision: "APPROVED"; staff_email: string; decided_at: string };

async function ensureTable(): Promise<void> {
  await runOnce("customs_reviews", async () => (await getSql()).exec(`
    CREATE TABLE IF NOT EXISTS customs_reviews (
      shipment_id TEXT PRIMARY KEY,
      decision TEXT NOT NULL,
      staff_email TEXT NOT NULL,
      decided_at TEXT NOT NULL
    );
  `));
}

/** Staff decision on AI-flagged goods, if any. */
export async function getCustomsReview(shipmentId: string): Promise<Review | null> {
  try {
    await ensureTable();
    return ((await (await getSql()).prepare(`SELECT decision, staff_email, decided_at FROM customs_reviews WHERE shipment_id = ?`).get(shipmentId)) as Review | undefined) ?? null;
  } catch (error) {
    console.error("[customs-review.ts:getCustomsReview]", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Why payment must wait, or null. Only an AI "prohibited" verdict holds a booking, and only
 * until a staff member approves the goods; the AI never blocks on its own judgement for good.
 */
export async function customsReviewHold(shipmentId: string): Promise<string | null> {
  const check = await latestCustomsCheck(shipmentId);
  if (check?.verdict !== "prohibited") return null;
  const review = await getCustomsReview(shipmentId);
  if (review && review.decided_at >= check.checkedAt) return null;
  return "Our customs desk needs to review these goods before you pay. We will contact you within one working day.";
}

/** Staff: approve AI-flagged goods so the customer can pay and book. */
export async function approveCustomsReview(shipmentId: string, staffEmail: string): Promise<{ ok: true } | { error: string }> {
  try {
    await ensureTable();
    await (await getSql())
      .prepare(
        `INSERT INTO customs_reviews (shipment_id, decision, staff_email, decided_at) VALUES (?, 'APPROVED', ?, ?)
         ON CONFLICT(shipment_id) DO UPDATE SET decision = 'APPROVED', staff_email = excluded.staff_email, decided_at = excluded.decided_at`,
      )
      .run(shipmentId, staffEmail, new Date().toISOString());
    return { ok: true };
  } catch (error) {
    console.error("[customs-review.ts:approveCustomsReview]", error instanceof Error ? error.message : error);
    return { error: "Could not save the review." };
  }
}
