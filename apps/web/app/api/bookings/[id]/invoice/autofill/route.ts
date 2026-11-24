import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { autofillInvoice } from "@/lib/data/invoice-autofill";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";
// Reading a multi-page invoice can take up to a minute.
export const maxDuration = 90;

/** Customer: draft customs lines read from their uploaded invoice. Nothing is saved here. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const { id } = await context.params;
    const result = await autofillInvoice(user.id, id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ invoice: result.invoice });
  } catch (error) {
    console.error("[invoice/autofill/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Reading the invoice failed. You can still fill in the lines yourself." }, { status: 500 });
  }
}
