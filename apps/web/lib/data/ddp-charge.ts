import { getSql } from "@/lib/sql";
import { estimateDuties, type DutyEstimate } from "@/lib/domain/duty-estimate";
import { getDutySettings } from "@/lib/data/duty-settings";
import { getInvoiceForShipment } from "@/lib/data/invoice-read";

export type DdpCharge =
  | { incoterm: "DAP" }
  | { incoterm: "DDP"; estimate: DutyEstimate }
  | { incoterm: "DDP"; problem: string };

/**
 * Duties and taxes the sender pays when the invoice says DDP, in the booking currency.
 * DAP (receiver pays) adds nothing. A destination without a duty rule cannot be priced.
 */
export async function ddpCharge(shipmentId: string, chargeCurrency: string): Promise<DdpCharge> {
  try {
    const invoice = await getInvoiceForShipment(shipmentId);
    if (!invoice || invoice.incoterm !== "DDP") return { incoterm: "DAP" };
    const row = (await (await getSql())
      .prepare(`SELECT destination_country FROM shipments WHERE id = ?`)
      .get(shipmentId)) as { destination_country: string } | undefined;
    const settings = await getDutySettings();
    const country = row?.destination_country?.toUpperCase() ?? "";
    const rule = settings.rules[country];
    if (!rule) {
      return { incoterm: "DDP", problem: "Sender-paid duties (DDP) cannot be priced online for this country yet. Choose DAP (receiver pays), or contact us for a duty quote." };
    }
    return {
      incoterm: "DDP",
      estimate: estimateDuties({
        goodsValue: invoice.totalValue,
        freight: invoice.freightCharge,
        insurance: invoice.insuranceCharge,
        invoiceCurrency: invoice.currency,
        chargeCurrency,
        rule,
        usdToNpr: settings.usdToNpr,
      }),
    };
  } catch (error) {
    console.error("[ddp-charge.ts:ddpCharge]", error instanceof Error ? error.message : error);
    return { incoterm: "DDP", problem: "Could not estimate duties right now. Please try again." };
  }
}
