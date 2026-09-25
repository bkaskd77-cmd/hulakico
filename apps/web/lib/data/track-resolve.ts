import { getDb } from "@/lib/db";

/** Resolve public track lookup by Hulakico AWB or tracking token. */
export function resolveTrackingQuery(
  raw: string,
): { token: string } | { error: string } {
  try {
    const q = raw.trim();
    if (!q || q.length < 4 || q.length > 80) {
      return { error: "Enter a Hulakico AWB or tracking code." };
    }
    const db = getDb();
    const byToken = db
      .prepare(
        `SELECT tracking_token FROM shipments
         WHERE tracking_token = ? AND hulakico_awb IS NOT NULL LIMIT 1`,
      )
      .get(q) as { tracking_token: string } | undefined;
    if (byToken?.tracking_token) return { token: byToken.tracking_token };

    const byAwb = db
      .prepare(
        `SELECT tracking_token FROM shipments
         WHERE lower(hulakico_awb) = lower(?) AND tracking_token IS NOT NULL
         LIMIT 1`,
      )
      .get(q) as { tracking_token: string } | undefined;
    if (byAwb?.tracking_token) return { token: byAwb.tracking_token };

    return { error: "No shipment matched that code." };
  } catch (error) {
    console.error(
      "[track-resolve.ts:resolveTrackingQuery]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Tracking lookup failed. Try again." };
  }
}
