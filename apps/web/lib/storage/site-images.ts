import { put } from "@vercel/blob";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Stores a staff-uploaded website image in Vercel Blob and returns its public URL. */
export async function uploadSiteImage(file: File): Promise<{ url: string } | { error: string }> {
  try {
    const extension = ALLOWED_TYPES[file.type];
    if (!extension) return { error: "Use a JPG, PNG, WebP or AVIF image." };
    if (file.size > MAX_IMAGE_BYTES) return { error: "Images must be 4 MB or smaller." };
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return { error: "Image uploads are not configured on this server (Vercel Blob token missing)." };
    }
    const blob = await put(`site/image.${extension}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return { url: blob.url };
  } catch (error) {
    console.error(
      "[site-images.ts:uploadSiteImage]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not upload the image. Please try again." };
  }
}
