import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSql } from "@/lib/sql";
import { runOnce } from "@/lib/sql/once";

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
/** Uploaded invoices are removed this long after the shipment is delivered, cancelled, or returned. */
const KEEP_DAYS = 90;

const KINDS = {
  pdf: { type: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  jpg: { type: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  png: { type: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
} as const;

type Kind = keyof typeof KINDS;
export type InvoiceUpload = { fileName: string; kind: Kind; bytes: number; uploadedAt: string };

function uploadDir(): string {
  return process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "data", "uploads");
}

function filePath(shipmentId: string, kind: Kind): string {
  if (!/^[A-Za-z0-9_]+$/.test(shipmentId)) throw new Error("Bad shipment id.");
  return path.join(uploadDir(), `invoice-${shipmentId}.${kind}`);
}

async function ensureTable(): Promise<void> {
  await runOnce("invoice_uploads", async () => (await getSql()).exec(`
    CREATE TABLE IF NOT EXISTS invoice_uploads (
      shipment_id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      kind TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL
    );
  `));
}

/** The file type from its first bytes; the name and browser-sent type are never trusted. */
function detectKind(data: Uint8Array): Kind | null {
  for (const [kind, info] of Object.entries(KINDS) as Array<[Kind, (typeof KINDS)[Kind]]>) {
    if (info.magic.every((byte, index) => data[index] === byte)) return kind;
  }
  return null;
}

export async function getInvoiceUpload(shipmentId: string): Promise<InvoiceUpload | null> {
  try {
    await ensureTable();
    const row = (await (await getSql()).prepare(`SELECT file_name, kind, bytes, uploaded_at FROM invoice_uploads WHERE shipment_id = ?`).get(shipmentId)) as
      | { file_name: string; kind: Kind; bytes: number; uploaded_at: string } | undefined;
    return row ? { fileName: row.file_name, kind: row.kind, bytes: Number(row.bytes), uploadedAt: row.uploaded_at } : null;
  } catch (error) {
    console.error("[invoice-uploads.ts:getInvoiceUpload]", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Saves (or replaces) the customer's own invoice file for a shipment. */
export async function saveInvoiceUpload(shipmentId: string, file: File): Promise<{ ok: true; upload: InvoiceUpload } | { error: string }> {
  try {
    if (file.size > MAX_UPLOAD_BYTES) return { error: "The file is larger than 3 MB. Save a smaller PDF or photo." };
    const data = new Uint8Array(await file.arrayBuffer());
    const kind = detectKind(data);
    if (!kind) return { error: "Upload a PDF, JPG, or PNG file." };
    await ensureTable();
    const previous = await getInvoiceUpload(shipmentId);
    await mkdir(uploadDir(), { recursive: true });
    if (previous && previous.kind !== kind) await rm(filePath(shipmentId, previous.kind), { force: true });
    await writeFile(filePath(shipmentId, kind), data, { mode: 0o600 });
    const upload: InvoiceUpload = { fileName: file.name.replace(/[^\w .()-]/g, "_").slice(0, 100) || `invoice.${kind}`, kind, bytes: data.length, uploadedAt: new Date().toISOString() };
    await (await getSql())
      .prepare(
        `INSERT INTO invoice_uploads (shipment_id, file_name, kind, bytes, uploaded_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(shipment_id) DO UPDATE SET file_name = excluded.file_name, kind = excluded.kind, bytes = excluded.bytes, uploaded_at = excluded.uploaded_at`,
      )
      .run(shipmentId, upload.fileName, kind, upload.bytes, upload.uploadedAt);
    return { ok: true, upload };
  } catch (error) {
    console.error("[invoice-uploads.ts:saveInvoiceUpload]", error instanceof Error ? error.message : error);
    return { error: "Could not save the file. Please try again." };
  }
}

/** The stored file and its content type, for the owner or staff. */
export async function readInvoiceUpload(shipmentId: string): Promise<{ data: Uint8Array; type: string; upload: InvoiceUpload } | null> {
  const upload = await getInvoiceUpload(shipmentId);
  if (!upload) return null;
  try {
    return { data: new Uint8Array(await readFile(filePath(shipmentId, upload.kind))), type: KINDS[upload.kind].type, upload };
  } catch (error) {
    console.error("[invoice-uploads.ts:readInvoiceUpload]", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function deleteInvoiceUpload(shipmentId: string): Promise<void> {
  const upload = await getInvoiceUpload(shipmentId);
  if (upload) await rm(filePath(shipmentId, upload.kind), { force: true });
  await (await getSql()).prepare(`DELETE FROM invoice_uploads WHERE shipment_id = ?`).run(shipmentId);
}

/** Removes files 90 days after a shipment finished, and files whose draft was removed. */
export async function purgeOldInvoiceUploads(): Promise<number> {
  try {
    await ensureTable();
    const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString();
    const rows = (await (await getSql())
      .prepare(
        `SELECT u.shipment_id FROM invoice_uploads u LEFT JOIN shipments s ON s.id = u.shipment_id
         WHERE s.id IS NULL OR (s.status IN ('DELIVERED', 'CANCELLED', 'RTO') AND s.updated_at < ?)`,
      )
      .all(cutoff)) as Array<{ shipment_id: string }>;
    for (const row of rows) await deleteInvoiceUpload(row.shipment_id);
    return rows.length;
  } catch (error) {
    console.error("[invoice-uploads.ts:purgeOldInvoiceUploads]", error instanceof Error ? error.message : error);
    return 0;
  }
}
