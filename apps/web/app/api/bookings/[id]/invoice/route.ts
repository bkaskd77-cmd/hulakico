import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import {
  getInvoiceForShipment,
  upsertCommercialInvoice,
} from "@/lib/data/invoices";
import { getDraftShipmentForUser } from "@/lib/data/shipments";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

async function requireOwner(shipmentId: string) {
  const token = await readSessionToken();
  const user = token ? await getUserBySessionToken(token) : null;
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const shipment = await getDraftShipmentForUser(user.id, shipmentId);
  if (!shipment) {
    return { error: NextResponse.json({ error: "Shipment not found." }, { status: 404 }) };
  }
  return { user, shipment };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const owned = await requireOwner(id);
    if ("error" in owned) return owned.error;
    if (owned.shipment.lane !== "INTERNATIONAL") {
      return NextResponse.json(
        { error: "Commercial invoices are for international lanes only." },
        { status: 400 },
      );
    }
    return NextResponse.json({ invoice: await getInvoiceForShipment(id) });
  } catch (error) {
    console.error(
      "[bookings/[id]/invoice/route.ts:GET]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Could not load invoice." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const owned = await requireOwner(id);
    if ("error" in owned) return owned.error;
    if (owned.shipment.lane !== "INTERNATIONAL") {
      return NextResponse.json(
        { error: "Commercial invoices are for international lanes only." },
        { status: 400 },
      );
    }
    const body = await request.json();
    const result = await upsertCommercialInvoice({
      shipmentId: id,
      currency: body.currency ?? owned.shipment.currency,
      exportReason: body.exportReason ?? "SALE",
      notes: body.notes,
      lines: body.lines ?? [],
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ invoice: result.invoice });
  } catch (error) {
    console.error(
      "[bookings/[id]/invoice/route.ts:POST]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Could not save invoice." }, { status: 500 });
  }
}
