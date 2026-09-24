import { getDb } from "@/lib/db";

export type SettleSummary = {
  mode: "COD" | "NONE";
  status: "PENDING_COLLECTION" | "COLLECTED" | "NOT_APPLICABLE";
  label: string;
  amount: number | null;
  currency: string | null;
};

/** Customer-facing pay/settle snapshot for one shipment. */
export function getSettleSummary(shipmentId: string): SettleSummary {
  try {
    const db = getDb();
    const shipment = db
      .prepare(`SELECT wants_cod, currency FROM shipments WHERE id = ?`)
      .get(shipmentId) as { wants_cod: number; currency: string } | undefined;
    if (!shipment) {
      return {
        mode: "NONE",
        status: "NOT_APPLICABLE",
        label: "Settle status unavailable",
        amount: null,
        currency: null,
      };
    }
    if (shipment.wants_cod !== 1) {
      return {
        mode: "NONE",
        status: "NOT_APPLICABLE",
        label: "No COD — freight settled outside Hulakico (partner / invoice)",
        amount: null,
        currency: shipment.currency,
      };
    }
    const cod = db
      .prepare(
        `SELECT amount, currency, status FROM cod_collections
         WHERE shipment_id = ? ORDER BY created_at DESC LIMIT 1`,
      )
      .get(shipmentId) as
      | { amount: number; currency: string; status: string }
      | undefined;
    if (!cod) {
      return {
        mode: "COD",
        status: "PENDING_COLLECTION",
        label: "COD requested — collection record pending",
        amount: null,
        currency: shipment.currency,
      };
    }
    if (cod.status === "COLLECTED") {
      return {
        mode: "COD",
        status: "COLLECTED",
        label: `COD collected · ${cod.currency} ${cod.amount.toFixed(2)}`,
        amount: cod.amount,
        currency: cod.currency,
      };
    }
    return {
      mode: "COD",
      status: "PENDING_COLLECTION",
      label: `COD pending collection · ${cod.currency} ${cod.amount.toFixed(2)}`,
      amount: cod.amount,
      currency: cod.currency,
    };
  } catch (error) {
    console.error(
      "[settle.ts:getSettleSummary]",
      error instanceof Error ? error.message : error,
    );
    return {
      mode: "NONE",
      status: "NOT_APPLICABLE",
      label: "Could not load settle status",
      amount: null,
      currency: null,
    };
  }
}

/** Short badge for shipment lists. */
export function settleShortLabel(summary: SettleSummary): string {
  if (summary.mode === "COD" && summary.status === "COLLECTED") return "COD collected";
  if (summary.mode === "COD") return "COD pending";
  return "No COD";
}
