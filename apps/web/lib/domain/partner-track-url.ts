/** Public partner tracking URLs (customer self-serve; no API required). */

export function partnerTrackUrl(
  carrierName: string | null | undefined,
  externalAwb: string | null | undefined,
): string | null {
  try {
    const awb = externalAwb?.trim();
    if (!awb) return null;

    const name = (carrierName ?? "").toLowerCase();
    const encoded = encodeURIComponent(awb);

    if (name.includes("dhl")) {
      return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encoded}`;
    }
    if (name.includes("fedex")) {
      return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
    }

    return `https://www.google.com/search?q=${encodeURIComponent(`${carrierName ?? "courier"} tracking ${awb}`)}`;
  } catch (error) {
    console.error(
      "[partner-track-url.ts:partnerTrackUrl]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
