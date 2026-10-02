import { createHash } from "node:crypto";
import { getSql } from "@/lib/sql";

const DAY_MS = 24 * 60 * 60 * 1000;
let tableReady = false;

async function ensureTable(): Promise<void> {
  if (tableReady) return;
  await (await getSql()).exec(
    `CREATE TABLE IF NOT EXISTS rate_limits (
      bucket TEXT PRIMARY KEY,
      hits INTEGER NOT NULL,
      window_start INTEGER NOT NULL
    )`,
  );
  tableReady = true;
}

export function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Shared attempt counter. Fails closed when the counter cannot be read. */
export async function enforceRateLimit(
  name: string,
  id: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: true } | { retry: true }> {
  try {
    const bucket = createHash("sha256").update(`${name}:${id}`).digest("hex");
    const now = Date.now();
    await ensureTable();
    const db = await getSql();
    const row = (await db
      .prepare("SELECT hits, window_start FROM rate_limits WHERE bucket = ?")
      .get(bucket)) as { hits: number; window_start: number } | undefined;
    if (!row || now - Number(row.window_start) >= windowMs) {
      await db
        .prepare(
          `INSERT INTO rate_limits (bucket, hits, window_start) VALUES (?, 1, ?)
           ON CONFLICT(bucket) DO UPDATE SET hits = 1, window_start = excluded.window_start`,
        )
        .run(bucket, now);
      await db.prepare("DELETE FROM rate_limits WHERE window_start < ?").run(now - DAY_MS);
      return { ok: true };
    }
    if (Number(row.hits) >= limit) return { retry: true };
    await db.prepare("UPDATE rate_limits SET hits = hits + 1 WHERE bucket = ?").run(bucket);
    return { ok: true };
  } catch (error) {
    console.error(
      "[rate-limit.ts:enforceRateLimit]",
      error instanceof Error ? error.message : error,
    );
    return { retry: true };
  }
}

export function tooManyResponse() {
  return { error: "Too many attempts. Try again later.", status: 429 as const };
}
