import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { deleteInvoiceUpload, getInvoiceUpload, readInvoiceUpload, saveInvoiceUpload } from "@/lib/data/invoice-uploads";
import { resolveOpsAccess } from "@/lib/data/ops-guard";
import { getDraftShipmentForUser } from "@/lib/data/shipment-query";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { readSessionToken } from "@/lib/http/session-cookie";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

/** The signed-in owner of the shipment, or null. */
async function owner(shipmentId: string) {
  const token = await readSessionToken();
  const user = token ? await getUserBySessionToken(token) : null;
  return user && (await getDraftShipmentForUser(user.id, shipmentId)) ? user : null;
}

/** Owner or staff: view the customer's own invoice file. `?info=1` returns its details only. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const allowed = (await owner(id)) || (await resolveOpsAccess(await readStaffSessionToken())).ok;
    if (!allowed) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (new URL(request.url).searchParams.get("info") === "1") return NextResponse.json({ upload: await getInvoiceUpload(id) });
    const file = await readInvoiceUpload(id);
    if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 404 });
    return new NextResponse(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.type,
        // PDFs download (browser PDF viewers refuse sandboxed pages); photos open in the tab.
        "Content-Disposition": `${file.upload.kind === "pdf" ? "attachment" : "inline"}; filename="${file.upload.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        // A stored file can never run scripts or load anything when opened.
        "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      },
    });
  } catch (error) {
    console.error("[invoice/upload/route.ts:GET]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not open the file." }, { status: 500 });
  }
}

/** Owner: upload or replace their own invoice (PDF, JPG, PNG up to 3 MB; 10 per hour). */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await owner(id);
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const limit = await enforceRateLimit("invoice-upload", user.id, 10, 60 * 60 * 1000);
    if ("retry" in limit) return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    const result = await saveInvoiceUpload(id, file);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ upload: result.upload });
  } catch (error) {
    console.error("[invoice/upload/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not save the file. Please try again." }, { status: 500 });
  }
}

/** Owner: remove their uploaded invoice. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!(await owner(id))) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    await deleteInvoiceUpload(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[invoice/upload/route.ts:DELETE]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not remove the file." }, { status: 500 });
  }
}
