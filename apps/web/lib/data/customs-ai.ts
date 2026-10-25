import { createHash } from "node:crypto";
import { z } from "zod";
import { getSql } from "@/lib/sql";
import { runOnce } from "@/lib/sql/once";
import { newId } from "@/lib/domain/auth";
import { CustomsCheckResult, runCustomsCheck, type CustomsCheckInput } from "@/lib/ai/customs-check";
import { getDraftShipmentForUser } from "@/lib/data/shipment-query";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { getInvoiceForShipment } from "@/lib/data/invoices";
import { sendOpsAlert } from "@/lib/data/ops-alerts";

const checkRequestSchema = z.object({
  currency: z.string().trim().max(3),
  exportReason: z.string().trim().max(30),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(2).max(200),
        quantity: z.number().nonnegative().max(100_000),
        unitValue: z.number().nonnegative().max(10_000_000),
        countryOfOrigin: z.string().trim().max(2),
        hsCode: z.string().trim().max(20),
      }),
    )
    .min(1)
    .max(40),
});

export type StoredCustomsCheck = CustomsCheckResult & { checkedAt: string };

async function ensureTable(): Promise<void> {
  await runOnce("customs_ai_checks", async () => (await getSql()).exec(`
    CREATE TABLE IF NOT EXISTS customs_ai_checks (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL,
      input_hash TEXT NOT NULL,
      verdict TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_customs_ai_checks_shipment ON customs_ai_checks(shipment_id, created_at);
  `));
}

/**
 * Customer: AI HS codes and destination restrictions for the invoice lines as typed.
 * Owner and international only, 10 checks per hour per customer, and an identical
 * re-check returns the stored answer without calling the AI again.
 */
export async function checkShipmentGoods(userId: string, shipmentId: string, body: unknown): Promise<StoredCustomsCheck | { error: string; status: number }> {
  try {
    const shipment = await getDraftShipmentForUser(userId, shipmentId);
    if (!shipment) return { error: "Shipment not found.", status: 404 };
    if (shipment.lane !== "INTERNATIONAL") return { error: "Customs checks are for international shipments.", status: 400 };
    const parsed = checkRequestSchema.safeParse(body);
    if (!parsed.success) return { error: "Add at least one item with a description first.", status: 400 };

    const input: CustomsCheckInput = { destinationCountry: shipment.destination_country, ...parsed.data };
    const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    await ensureTable();
    const db = await getSql();
    const cached = (await db
      .prepare(`SELECT result_json, created_at FROM customs_ai_checks WHERE shipment_id = ? AND input_hash = ? ORDER BY created_at DESC LIMIT 1`)
      .get(shipmentId, hash)) as { result_json: string; created_at: string } | undefined;
    if (cached) return { ...(JSON.parse(cached.result_json) as CustomsCheckResult), checkedAt: cached.created_at };

    const limit = await enforceRateLimit("customs-ai", userId, 10, 60 * 60 * 1000);
    if ("retry" in limit) return { error: "You have used the AI check 10 times this hour. Try again later.", status: 429 };

    const result = await runCustomsCheck(input);
    if ("error" in result) return { error: result.error, status: 502 };
    const checkedAt = new Date().toISOString();
    await db
      .prepare(`INSERT INTO customs_ai_checks (id, shipment_id, input_hash, verdict, result_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(newId("cai"), shipmentId, hash, result.verdict, JSON.stringify(result), checkedAt);
    if (result.verdict === "prohibited") {
      await sendOpsAlert(`customs:${shipmentId}`, "AI flagged goods that may not be shippable",
        `Shipment ${shipmentId} to ${input.destinationCountry}: ${result.summary}
Payment is held until you approve the goods on the Admin shipment page.`);
    }
    return { ...result, checkedAt };
  } catch (error) {
    console.error("[customs-ai.ts:checkShipmentGoods]", error instanceof Error ? error.message : error);
    return { error: "The AI check failed. You can still save the invoice.", status: 500 };
  }
}

/**
 * Screens the saved invoice (used before payment, so every international booking is checked
 * even if the customer never pressed the button). An identical earlier check is reused.
 */
export async function screenSavedInvoice(shipmentId: string): Promise<StoredCustomsCheck | null> {
  try {
    const owner = (await (await getSql()).prepare(`SELECT user_id FROM shipments WHERE id = ?`).get(shipmentId)) as { user_id: string } | undefined;
    const invoice = await getInvoiceForShipment(shipmentId);
    if (!owner || !invoice?.lines.length) return null;
    const result = await checkShipmentGoods(owner.user_id, shipmentId, {
      currency: invoice.currency,
      exportReason: invoice.exportReason,
      lines: invoice.lines.map((line) => ({
        description: line.description, quantity: line.quantity, unitValue: line.unitValue,
        countryOfOrigin: line.countryOfOrigin ?? "", hsCode: line.hsCode ?? "",
      })),
    });
    return "error" in result ? null : result;
  } catch (error) {
    console.error("[customs-ai.ts:screenSavedInvoice]", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Newest AI check for a shipment, for Admin and the payment hold. */
export async function latestCustomsCheck(shipmentId: string): Promise<StoredCustomsCheck | null> {
  try {
    await ensureTable();
    const row = (await (await getSql())
      .prepare(`SELECT result_json, created_at FROM customs_ai_checks WHERE shipment_id = ? ORDER BY created_at DESC LIMIT 1`)
      .get(shipmentId)) as { result_json: string; created_at: string } | undefined;
    if (!row) return null;
    const parsed = CustomsCheckResult.safeParse(JSON.parse(row.result_json));
    return parsed.success ? { ...parsed.data, checkedAt: row.created_at } : null;
  } catch (error) {
    console.error("[customs-ai.ts:latestCustomsCheck]", error instanceof Error ? error.message : error);
    return null;
  }
}
