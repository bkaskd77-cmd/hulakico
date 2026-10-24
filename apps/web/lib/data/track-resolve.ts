import { normalizeAwb } from "@/lib/domain/awb";
import { getSql } from "@/lib/sql";

/** Resolve public track lookup by Hulakico AWB or tracking token. */
export async function resolveTrackingQuery(
  raw: string,
): Promise<{ token: string } | { error: string }> {
  try {
    const q = raw.trim();
    if (!q || q.length < 4 || q.length > 80) {
      return { error: "Enter a Hulakico AWB or tracking code." };
    }
    const db = await getSql();
    const byToken = (await db
      .prepare(
        `SELECT tracking_token FROM shipments
         WHERE tracking_token = ? AND hulakico_awb IS NOT NULL LIMIT 1`,
      )
      .get(q)) as { tracking_token: string } | undefined;
    if (byToken?.tracking_token) return { token: byToken.tracking_token };

    // Accept "hk 7q4m 2x9k pa3r", "7Q4M2X9KPA3R", or the printed HK-7Q4M-2X9K-PA3R.
    const typed = normalizeAwb(q);
    const awb = typed.startsWith("HK") ? typed : `HK${typed}`;
    const byAwb = (await db
      .prepare(
        `SELECT tracking_token FROM shipments
         WHERE replace(upper(hulakico_awb), '-', '') = ? AND tracking_token IS NOT NULL
         LIMIT 1`,
      )
      .get(awb)) as { tracking_token: string } | undefined;
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
