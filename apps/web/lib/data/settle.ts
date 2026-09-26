import { getSql } from "@/lib/sql";

export type SettleSummary = {
  mode: "COD" | "TRANSFER" | "NONE";
  status:
    | "PENDING_COLLECTION"
    | "COLLECTED"
    | "AWAITING_PAYMENT"
    | "PAID"
    | "NOT_APPLICABLE";
  label: string;
  detail: string | null;
  amount: number | null;
  currency: string | null;
};

/** Customer-facing pay/settle snapshot for one shipment. */
export async function getSettleSummary(shipmentId: string): Promise<SettleSummary> {
  try {
    const db = await getSql();
    const shipment = (await db
      .prepare(`SELECT wants_cod, currency, status FROM shipments WHERE id = ?`)
      .get(shipmentId)) as
      | { wants_cod: number; currency: string; status: string }
      | undefined;
    if (!shipment) {
      return {
        mode: "NONE",
        status: "NOT_APPLICABLE",
        label: "Settle status unavailable",
        detail: null,
        amount: null,
        currency: null,
      };
    }

    if (shipment.wants_cod === 1) {
      const cod = (await db
        .prepare(
          `SELECT amount, currency, status FROM cod_collections
           WHERE shipment_id = ? ORDER BY created_at DESC LIMIT 1`,
        )
        .get(shipmentId)) as
        | { amount: number; currency: string; status: string }
        | undefined;
      if (!cod) {
        return {
          mode: "COD",
          status: "PENDING_COLLECTION",
          label: "COD requested — collection record pending",
          detail: null,
          amount: null,
          currency: shipment.currency,
        };
      }
      if (cod.status === "COLLECTED") {
        return {
          mode: "COD",
          status: "COLLECTED",
          label: `COD collected · ${cod.currency} ${cod.amount.toFixed(2)}`,
          detail: null,
          amount: cod.amount,
          currency: cod.currency,
        };
      }
      return {
        mode: "COD",
        status: "PENDING_COLLECTION",
        label: `COD pending collection · ${cod.currency} ${cod.amount.toFixed(2)}`,
        detail: null,
        amount: cod.amount,
        currency: cod.currency,
      };
    }

    const booked = !["DRAFT", "QUOTED", "CANCELLED"].includes(shipment.status);
    if (booked) {
      // Read-only: never INSERT payment intents from settle/list views.
      const pay = (await db
        .prepare(
          `SELECT amount, currency, status, instructions FROM payment_intents
           WHERE shipment_id = ? AND status != 'CANCELLED'
           ORDER BY created_at DESC LIMIT 1`,
        )
        .get(shipmentId)) as
        | {
            amount: number;
            currency: string;
            status: string;
            instructions: string | null;
          }
        | undefined;
      if (pay) {
        if (pay.status === "PAID") {
          return {
            mode: "TRANSFER",
            status: "PAID",
            label: `Paid · ${pay.currency} ${pay.amount.toFixed(2)}`,
            detail: null,
            amount: pay.amount,
            currency: pay.currency,
          };
        }
        return {
          mode: "TRANSFER",
          status: "AWAITING_PAYMENT",
          label: `Pay by transfer · ${pay.currency} ${pay.amount.toFixed(2)}`,
          detail: pay.instructions,
          amount: pay.amount,
          currency: pay.currency,
        };
      }
    }

    return {
      mode: "NONE",
      status: "NOT_APPLICABLE",
      label: "No COD — freight settled outside Hulakico (partner / invoice)",
      detail: null,
      amount: null,
      currency: shipment.currency,
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
      detail: null,
      amount: null,
      currency: null,
    };
  }
}

/** Short badge for shipment lists. */
export function settleShortLabel(summary: SettleSummary): string {
  if (summary.mode === "COD" && summary.status === "COLLECTED") return "COD collected";
  if (summary.mode === "COD") return "COD pending";
  if (summary.mode === "TRANSFER" && summary.status === "PAID") return "Paid";
  if (summary.mode === "TRANSFER") return "Pay pending";
  return "No COD";
}
