import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { checkShipmentGoods } from "@/lib/data/customs-ai";
import { readSessionToken } from "@/lib/http/session-cookie";
import { aiEnabled } from "@/lib/ai/claude";

export const runtime = "nodejs";
// The AI answer can take up to a minute.
export const maxDuration = 90;

/** Whether the AI check is switched on (the editor hides the button when it is not). */
export async function GET() {
  return NextResponse.json({ enabled: aiEnabled() });
}

/** Customer: AI HS codes and destination restrictions for the invoice items as typed. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const { id } = await context.params;
    const result = await checkShipmentGoods(user.id, id, await request.json());
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ check: result });
  } catch (error) {
    console.error("[invoice/ai-check/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "The AI check failed. You can still save the invoice." }, { status: 500 });
  }
}
