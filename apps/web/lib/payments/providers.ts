/** Nepal wallet providers — stub checkout URLs until live merchant keys. */

export const WALLET_PROVIDERS = [
  { id: "esewa", label: "eSewa" },
  { id: "khalti", label: "Khalti" },
  { id: "connect_ips", label: "Connect IPS" },
] as const;

export type WalletProviderId = (typeof WALLET_PROVIDERS)[number]["id"];

export function isWalletProvider(value: string): value is WalletProviderId {
  return WALLET_PROVIDERS.some((p) => p.id === value);
}

export function walletLabel(provider: string): string {
  return WALLET_PROVIDERS.find((p) => p.id === provider)?.label ?? provider;
}

/** Local stub checkout page — swap for real gateway redirect when live. */
export function stubCheckoutUrl(intentId: string): string {
  return `/pay/stub/${encodeURIComponent(intentId)}`;
}

export function payProviderMode(): "stub" | "off" {
  const mode = (process.env.PAY_PROVIDER || "stub").trim().toLowerCase();
  return mode === "off" ? "off" : "stub";
}
