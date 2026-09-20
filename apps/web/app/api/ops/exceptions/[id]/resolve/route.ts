import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { resolveException } from "@/lib/data/exceptions";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await readSessionToken();
    const user = token ? getUserBySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = (await request.json()) as { resolutionNote?: string };
    if (!body.resolutionNote) {
      return NextResponse.json(
        { error: "resolutionNote is required." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    resolveException(id, body.resolutionNote);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[ops/exceptions/[id]/resolve/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    const message =
      error instanceof Error ? error.message : "Could not resolve exception.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
