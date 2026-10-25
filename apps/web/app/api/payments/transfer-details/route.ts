import { NextResponse } from "next/server";
import { getContactSettings } from "@/lib/data/company-contact-content";
import { payProviderMode } from "@/lib/payments/providers";

export const runtime = "nodejs";

/** Public: how customers pay right now, and the bank / QR details for transfer mode. */
export async function GET() {
  try {
    const mode = payProviderMode();
    if (mode !== "transfer") return NextResponse.json({ mode });
    const c = await getContactSettings();
    return NextResponse.json({
      mode,
      bankName: c.bankName,
      accountName: c.bankAccountName,
      accountNumber: c.bankAccountNumber,
      qrImage: c.paymentQr,
      configured: Boolean(c.bankAccountNumber || c.paymentQr),
    });
  } catch (error) {
    console.error("[api/payments/transfer-details/route.ts:GET]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not load payment details." }, { status: 500 });
  }
}
