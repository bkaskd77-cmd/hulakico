import { NextResponse } from "next/server";
import { getSql } from "@/lib/sql";
import { sendOpsAlert } from "@/lib/data/ops-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkDatabase(): Promise<{ ok: boolean; ms: number }> {
  const started = Date.now();
  try {
    await (await getSql()).prepare("SELECT 1 AS ok").get();
    return { ok: true, ms: Date.now() - started };
  } catch (error) {
    console.error("[api/health/route.ts:checkDatabase]", error instanceof Error ? error.message : error);
    return { ok: false, ms: Date.now() - started };
  }
}

async function checkIntelligence(): Promise<boolean | null> {
  const base = process.env.INTELLIGENCE_API_URL?.trim();
  if (!base) return null;
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(2500), cache: "no-store" });
    return response.ok;
  } catch (error) {
    console.error("[api/health/route.ts:checkIntelligence]", error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Health for uptime monitors: 200 when the database answers, 503 when it does not.
 * The AI service is reported but optional (the site works without it). No secrets or data.
 */
export async function GET() {
  const [database, intelligence] = await Promise.all([checkDatabase(), checkIntelligence()]);
  const body = {
    ok: database.ok,
    database: database.ok ? "up" : "down",
    databaseMs: database.ms,
    intelligence: intelligence === null ? "not configured" : intelligence ? "up" : "down",
    time: new Date().toISOString(),
  };
  if (!database.ok) await sendOpsAlert("health:database", "Database is not answering", "The website cannot reach its database. Customers cannot sign in, book, or track.");
  else if (intelligence === false) await sendOpsAlert("health:intelligence", "AI service is down", "The intelligence service is not answering. Booking still works; delay-risk scores fall back to rules.");
  return NextResponse.json(body, { status: database.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
