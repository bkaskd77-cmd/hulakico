import { NextResponse } from "next/server";
import { saveContactMessage } from "@/lib/data/contact-messages";
import { sendInquiryEmail } from "@/lib/data/inquiry-mail";
import { contactMessageSchema } from "@/lib/domain/contact";
import { enforceRateLimit, requestIp } from "@/lib/http/rate-limit";

export const runtime = "nodejs";

/** Public contact form — validated, honeypot-protected, stored for the team. */
export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRateLimit("contact", requestIp(request), 5, 60 * 60 * 1000);
    if ("retry" in ipLimit) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const parsed = contactMessageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check your name, email, and message." },
        { status: 400 },
      );
    }
    const result = await saveContactMessage(parsed.data);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    const mailed = await sendInquiryEmail(parsed.data);
    if ("error" in mailed) {
      return NextResponse.json({ error: mailed.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error(
      "[api/contact/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Could not send your message." },
      { status: 500 },
    );
  }
}
