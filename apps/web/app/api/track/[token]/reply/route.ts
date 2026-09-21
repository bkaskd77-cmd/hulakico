import { NextResponse } from "next/server";
import { submitCustomerReply } from "@/lib/data/exception-info";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const body = (await request.json()) as { reply?: string };
    const result = submitCustomerReply(token, body.reply ?? "");
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[api/track/[token]/reply/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Reply failed." }, { status: 500 });
  }
}
