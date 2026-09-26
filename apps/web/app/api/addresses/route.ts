import { NextResponse } from "next/server";
import {
  createSavedAddress,
  listSavedAddresses,
} from "@/lib/data/addresses";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export async function GET() {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const addresses = listSavedAddresses(user.id);
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error(
      "[api/addresses/route.ts:GET]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Could not load addresses." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = await readSessionToken();
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = (await request.json()) as {
      label?: string;
      contactName?: string;
      company?: string;
      phone?: string;
      email?: string;
      country?: string;
      city?: string;
      postalCode?: string;
      line1?: string;
      line2?: string;
    };

    if (!body.label || !body.contactName || !body.country || !body.city || !body.line1) {
      return NextResponse.json(
        { error: "label, contactName, country, city, and line1 are required." },
        { status: 400 },
      );
    }

    const result = createSavedAddress(user.id, {
      label: body.label,
      contactName: body.contactName,
      company: body.company,
      phone: body.phone,
      email: body.email,
      country: body.country,
      city: body.city,
      postalCode: body.postalCode,
      line1: body.line1,
      line2: body.line2,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    console.error(
      "[api/addresses/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Could not save address." },
      { status: 500 },
    );
  }
}
