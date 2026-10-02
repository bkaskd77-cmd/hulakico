import { put } from "@vercel/blob";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const PUBLIC_BLOB_STORE = "store_CicVPFwP5DejkJCI";

function bytesMatchType(type: string, body: Buffer): boolean {
  if (type === "image/jpeg") return body.length > 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
  if (type === "image/png") {
    return body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (type === "image/webp") {
    return body.length > 12 && body.subarray(0, 4).toString("ascii") === "RIFF" && body.subarray(8, 12).toString("ascii") === "WEBP";
  }
  if (type === "image/avif") {
    return body.length > 12 && body.subarray(4, 8).toString("ascii") === "ftyp" && ["avif", "avis"].includes(body.subarray(8, 12).toString("ascii"));
  }
  return false;
}

/** Stores a staff-uploaded website image in Vercel Blob and returns its public URL. */
export async function uploadSiteImage(file: File): Promise<{ url: string } | { error: string }> {
  try {
    const extension = ALLOWED_TYPES[file.type];
    if (!extension) return { error: "Use a JPG, PNG, WebP or AVIF image." };
    if (file.size > MAX_IMAGE_BYTES) return { error: "Images must be 4 MB or smaller." };
    const body = Buffer.from(await file.arrayBuffer());
    if (!bytesMatchType(file.type, body)) return { error: "Use a JPG, PNG, WebP or AVIF image." };
    const blob = await put(`site/image.${extension}`, body, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
      storeId: PUBLIC_BLOB_STORE,
      ...(process.env.BLOB_READ_WRITE_TOKEN ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
    });
    return { url: blob.url };
  } catch (error) {
    console.error(
      "[site-images.ts:uploadSiteImage]",
      error instanceof Error ? error.message : error,
    );
    const message = error instanceof Error ? error.message : "";
    if (/token|oidc|unauthorized/i.test(message) && !/store/i.test(message)) {
      return { error: "Image uploads are not configured on this server (Vercel Blob token missing)." };
    }
    return { error: "Could not upload the image. Please try again." };
  }
}
