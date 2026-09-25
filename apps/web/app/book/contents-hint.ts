/** Shared copy for shipment contents — Document vs goods/parcel. */
export function contentsPlaceholder(packageType: string): string {
  if (packageType === "DOCUMENT") {
    return "Describe the documents — e.g. signed contract (10 pages), passport copies, certificates";
  }
  return "Describe goods in detail — e.g. Nike Air Max shoes (1 pair), cotton shirts";
}

/** Always-visible cue under the contents field (placeholder disappears once typed). */
export function contentsHint(packageType: string): string {
  if (packageType === "DOCUMENT") {
    return "Name each document type and quantity — avoid vague words like “papers” or “docs”.";
  }
  return "Include item type, brand/model, and quantity — avoid vague words like “clothing” or “electronics”.";
}
