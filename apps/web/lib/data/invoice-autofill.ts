import { extractInvoiceLines, type ExtractedInvoice } from "@/lib/ai/invoice-extract";
import { readInvoiceUpload } from "@/lib/data/invoice-uploads";
import { getDraftShipmentForUser } from "@/lib/data/shipments";
import { enforceRateLimit } from "@/lib/http/rate-limit";

/** AI reads per booking and per customer. When either is used up, the customer types the lines as before. */
export const AUTOFILL_LIMITS = {
  perBooking: { count: 3, windowMs: 30 * 24 * 60 * 60 * 1000 },
  perCustomer: { count: 10, windowMs: 60 * 60 * 1000 },
};

type Failure = { error: string; status: number };

const MANUAL = "You can still fill in the lines yourself.";

/** Fills draft customs lines from the customer's uploaded invoice; nothing is saved until they review and save. */
export async function autofillInvoice(userId: string, shipmentId: string): Promise<{ invoice: ExtractedInvoice } | Failure> {
  try {
    const shipment = await getDraftShipmentForUser(userId, shipmentId);
    if (!shipment) return { error: "Shipment not found.", status: 404 };
    if (shipment.lane !== "INTERNATIONAL") return { error: "A customs invoice is only needed for international shipments.", status: 400 };

    const upload = await readInvoiceUpload(shipmentId);
    if (!upload) return { error: "Upload your invoice first (PDF, JPG, or PNG).", status: 400 };

    const customer = await enforceRateLimit("invoice-autofill-customer", userId, AUTOFILL_LIMITS.perCustomer.count, AUTOFILL_LIMITS.perCustomer.windowMs);
    if ("retry" in customer) return { error: `You have used the automatic reading several times this hour. ${MANUAL}`, status: 429 };
    const booking = await enforceRateLimit("invoice-autofill-booking", shipmentId, AUTOFILL_LIMITS.perBooking.count, AUTOFILL_LIMITS.perBooking.windowMs);
    if ("retry" in booking) return { error: `This booking has used its ${AUTOFILL_LIMITS.perBooking.count} automatic readings. ${MANUAL}`, status: 429 };

    const result = await extractInvoiceLines(upload.data, upload.type);
    if ("error" in result) return { error: result.error, status: 422 };
    return { invoice: result.invoice };
  } catch (error) {
    console.error("[invoice-autofill.ts:autofillInvoice]", error instanceof Error ? error.message : error);
    return { error: `Reading the invoice failed. ${MANUAL}`, status: 500 };
  }
}
