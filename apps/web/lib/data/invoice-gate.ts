import { getInvoiceForShipment } from "@/lib/data/invoices";
import { invoiceProblem } from "@/lib/domain/invoice-qc";
import { getSql } from "@/lib/sql";

/**
 * International goods cannot be paid for or booked without a complete customs invoice.
 * Documents and domestic shipments need none. Returns why not, or null when ready.
 */
export async function customsInvoiceBlocker(shipmentId: string): Promise<string | null> {
  try {
    const row = (await (await getSql())
      .prepare(`SELECT lane, package_type FROM shipments WHERE id = ?`)
      .get(shipmentId)) as { lane: string; package_type: string } | undefined;
    if (!row) return "Shipment not found.";
    if (row.lane !== "INTERNATIONAL" || row.package_type === "DOCUMENT") return null;
    return invoiceProblem(await getInvoiceForShipment(shipmentId));
  } catch (error) {
    console.error("[invoice-gate.ts:customsInvoiceBlocker]", error instanceof Error ? error.message : error);
    // Fail closed: if we cannot check the invoice, do not let an international parcel through.
    return "Could not check the customs invoice. Please try again.";
  }
}
