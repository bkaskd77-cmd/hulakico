import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { suggestPlaces } from "@/lib/data/intelligence-client";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = (await request.json()) as {
      query?: string;
      countryHint?: string;
    };
    const query = body.query?.trim() ?? "";
    if (query.length < 2) {
      return NextResponse.json({ places: [] });
    }

    const places = await suggestPlaces({
      query,
      countryHint: body.countryHint,
    });
    return NextResponse.json({ places });
  } catch (error) {
    console.error(
      "[api/addresses/suggest/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ places: [], error: "Suggest failed." });
  }
}
