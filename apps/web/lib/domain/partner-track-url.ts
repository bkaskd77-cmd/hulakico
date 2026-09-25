/** Public partner tracking URLs (customer self-serve; no live API required). */

export const PARTNER_PRESETS = [
  {
    key: "dhl",
    label: "DHL",
    template:
      "https://www.dhl.com/en/express/tracking.html?AWB={AWB}&brand=DHL",
  },
  {
    key: "fedex",
    label: "FedEx",
    template: "https://www.fedex.com/fedextrack/?trknbr={AWB}",
  },
  { key: "other", label: "Other", template: null },
] as const;

export type PartnerKey = (typeof PARTNER_PRESETS)[number]["key"];

export function isPartnerKey(value: string): value is PartnerKey {
  return PARTNER_PRESETS.some((p) => p.key === value);
}

export function partnerLabelForKey(key: PartnerKey): string {
  return PARTNER_PRESETS.find((p) => p.key === key)?.label ?? key;
}

/** Build track URL from preset template or Ops override. */
export function resolvePartnerTrackUrl(input: {
  partnerKey: PartnerKey;
  awb: string;
  urlOverride?: string | null;
}): string | null {
  try {
    const override = input.urlOverride?.trim();
    if (override) {
      try {
        const parsed = new URL(override);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return null;
        }
        return parsed.toString();
      } catch {
        return null;
      }
    }

    const awb = input.awb.trim();
    if (!awb) return null;
    const preset = PARTNER_PRESETS.find((p) => p.key === input.partnerKey);
    if (!preset?.template) return null;
    return preset.template.replaceAll("{AWB}", encodeURIComponent(awb));
  } catch (error) {
    console.error(
      "[partner-track-url.ts:resolvePartnerTrackUrl]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/** Prefer fresh DHL/FedEx templates; use stored URL for Other / custom. */
export function effectivePartnerTrackUrl(input: {
  partnerLabel: string | null | undefined;
  awb: string | null | undefined;
  storedUrl: string | null | undefined;
}): string | null {
  try {
    const awb = input.awb?.trim();
    if (!awb) return null;
    const label = (input.partnerLabel ?? "").toLowerCase();
    if (label.includes("dhl")) {
      return resolvePartnerTrackUrl({ partnerKey: "dhl", awb });
    }
    if (label.includes("fedex")) {
      return resolvePartnerTrackUrl({ partnerKey: "fedex", awb });
    }
    const stored = input.storedUrl?.trim();
    return stored || null;
  } catch (error) {
    console.error(
      "[partner-track-url.ts:effectivePartnerTrackUrl]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/** Legacy helper — prefer stored partner_track_url on the shipment. */
export function partnerTrackUrl(
  carrierName: string | null | undefined,
  externalAwb: string | null | undefined,
): string | null {
  try {
    const awb = externalAwb?.trim();
    if (!awb) return null;
    const name = (carrierName ?? "").toLowerCase();
    if (name.includes("dhl")) {
      return resolvePartnerTrackUrl({ partnerKey: "dhl", awb });
    }
    if (name.includes("fedex")) {
      return resolvePartnerTrackUrl({ partnerKey: "fedex", awb });
    }
    return null;
  } catch (error) {
    console.error(
      "[partner-track-url.ts:partnerTrackUrl]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
