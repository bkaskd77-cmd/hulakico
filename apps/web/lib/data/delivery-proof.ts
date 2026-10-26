import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { getSql } from "@/lib/sql";
import { runOnce } from "@/lib/sql/once";
import { detectFileKind, FILE_KINDS, privateUploadDir, shipmentFilePath, type FileKind } from "@/lib/storage/file-kind";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
/** Photos are kept this long after delivery (disputes); the receiver's name stays on record. */
const PHOTO_KEEP_DAYS = 180;

export type DeliveryProof = { receivedBy: string; photoKind: FileKind | null; recordedBy: string; recordedAt: string };

async function ensureTable(): Promise<void> {
  await runOnce("delivery_proofs", async () => (await getSql()).exec(`
    CREATE TABLE IF NOT EXISTS delivery_proofs (
      shipment_id TEXT PRIMARY KEY,
      received_by TEXT NOT NULL,
      photo_kind TEXT,
      recorded_by TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );
  `));
}

export function cleanReceiverName(value: unknown): string {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** "Ram Kumar Sharma" → "R. S." for public pages; tracking links can be forwarded. */
export function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (!parts.length) return "";
  const picks = parts.length === 1 ? [parts[0]] : [parts[0], parts[parts.length - 1]];
  return picks.map((part) => `${part.charAt(0).toUpperCase()}.`).join(" ");
}

export async function getDeliveryProof(shipmentId: string): Promise<DeliveryProof | null> {
  try {
    await ensureTable();
    const row = (await (await getSql()).prepare(`SELECT received_by, photo_kind, recorded_by, recorded_at FROM delivery_proofs WHERE shipment_id = ?`).get(shipmentId)) as
      | { received_by: string; photo_kind: FileKind | null; recorded_by: string; recorded_at: string } | undefined;
    return row ? { receivedBy: row.received_by, photoKind: row.photo_kind, recordedBy: row.recorded_by, recordedAt: row.recorded_at } : null;
  } catch (error) {
    console.error("[delivery-proof.ts:getDeliveryProof]", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Records who received the parcel (staff, at the Delivered step). */
export async function recordReceiver(shipmentId: string, receivedBy: string, staffEmail: string): Promise<void> {
  await ensureTable();
  await (await getSql())
    .prepare(
      `INSERT INTO delivery_proofs (shipment_id, received_by, photo_kind, recorded_by, recorded_at) VALUES (?, ?, NULL, ?, ?)
       ON CONFLICT(shipment_id) DO UPDATE SET received_by = excluded.received_by, recorded_by = excluded.recorded_by, recorded_at = excluded.recorded_at`,
    )
    .run(shipmentId, receivedBy, staffEmail, new Date().toISOString());
}

/** Staff: attach the delivery photo (JPG/PNG up to 3 MB) to a recorded delivery. */
export async function saveDeliveryPhoto(shipmentId: string, file: File): Promise<{ ok: true } | { error: string }> {
  try {
    const proof = await getDeliveryProof(shipmentId);
    if (!proof) return { error: "Post the Delivered step with the receiver's name first." };
    if (file.size > MAX_PHOTO_BYTES) return { error: "The photo is larger than 3 MB." };
    const data = new Uint8Array(await file.arrayBuffer());
    const kind = detectFileKind(data, ["jpg", "png"]);
    if (!kind) return { error: "Upload a JPG or PNG photo." };
    await mkdir(privateUploadDir(), { recursive: true });
    if (proof.photoKind && proof.photoKind !== kind) await rm(shipmentFilePath("pod", shipmentId, proof.photoKind), { force: true });
    await writeFile(shipmentFilePath("pod", shipmentId, kind), data, { mode: 0o600 });
    await (await getSql()).prepare(`UPDATE delivery_proofs SET photo_kind = ? WHERE shipment_id = ?`).run(kind, shipmentId);
    return { ok: true };
  } catch (error) {
    console.error("[delivery-proof.ts:saveDeliveryPhoto]", error instanceof Error ? error.message : error);
    return { error: "Could not save the photo." };
  }
}

export async function readDeliveryPhoto(shipmentId: string): Promise<{ data: Uint8Array; type: string } | null> {
  const proof = await getDeliveryProof(shipmentId);
  if (!proof?.photoKind) return null;
  try {
    return { data: new Uint8Array(await readFile(shipmentFilePath("pod", shipmentId, proof.photoKind))), type: FILE_KINDS[proof.photoKind].type };
  } catch (error) {
    console.error("[delivery-proof.ts:readDeliveryPhoto]", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Removes delivery photos 180 days after the proof was recorded. */
export async function purgeOldDeliveryPhotos(): Promise<number> {
  try {
    await ensureTable();
    const cutoff = new Date(Date.now() - PHOTO_KEEP_DAYS * 86_400_000).toISOString();
    const db = await getSql();
    const rows = (await db.prepare(`SELECT shipment_id, photo_kind FROM delivery_proofs WHERE photo_kind IS NOT NULL AND recorded_at < ?`).all(cutoff)) as
      Array<{ shipment_id: string; photo_kind: FileKind }>;
    for (const row of rows) {
      await rm(shipmentFilePath("pod", row.shipment_id, row.photo_kind), { force: true });
      await db.prepare(`UPDATE delivery_proofs SET photo_kind = NULL WHERE shipment_id = ?`).run(row.shipment_id);
    }
    return rows.length;
  } catch (error) {
    console.error("[delivery-proof.ts:purgeOldDeliveryPhotos]", error instanceof Error ? error.message : error);
    return 0;
  }
}
