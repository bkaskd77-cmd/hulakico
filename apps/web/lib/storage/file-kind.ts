import path from "node:path";

/** Accepted private files, recognised by their first bytes (never by name or browser type). */
export const FILE_KINDS = {
  pdf: { type: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  jpg: { type: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  png: { type: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
} as const;

export type FileKind = keyof typeof FILE_KINDS;

export function detectFileKind(data: Uint8Array, allowed: readonly FileKind[] = ["pdf", "jpg", "png"]): FileKind | null {
  for (const kind of allowed) {
    if (FILE_KINDS[kind].magic.every((byte, index) => data[index] === byte)) return kind;
  }
  return null;
}

/** Private upload folder: a Docker volume on the server, data/uploads locally. */
export function privateUploadDir(): string {
  return process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "data", "uploads");
}

/** File path for a shipment's stored file, e.g. pod-shp_123.jpg. */
export function shipmentFilePath(prefix: string, shipmentId: string, kind: FileKind): string {
  if (!/^[A-Za-z0-9_]+$/.test(shipmentId)) throw new Error("Bad shipment id.");
  return path.join(privateUploadDir(), `${prefix}-${shipmentId}.${kind}`);
}
