/** Nepal wallet providers — stub by default; live via PAY_PROVIDER=live + env keys. */

export const WALLET_PROVIDERS = [
  { id: "esewa", label: "eSewa" },
  { id: "khalti", label: "Khalti" },
  { id: "connect_ips", label: "Connect IPS" },
] as const;

export type WalletProviderId = (typeof WALLET_PROVIDERS)[number]["id"];

export type PayProviderMode = "stub" | "live" | "off";

export function isWalletProvider(value: string): value is WalletProviderId {
  return WALLET_PROVIDERS.some((p) => p.id === value);
}

export function walletLabel(provider: string): string {
  return WALLET_PROVIDERS.find((p) => p.id === provider)?.label ?? provider;
}

/** Local stub checkout — used when PAY_PROVIDER is stub (default). */
export function stubCheckoutUrl(intentId: string): string {
  return `/pay/stub/${encodeURIComponent(intentId)}`;
}

export function payProviderMode(): PayProviderMode {
  const mode = (process.env.PAY_PROVIDER || "stub").trim().toLowerCase();
  if (mode === "off") return "off";
  if (mode === "live") return "live";
  return "stub";
}

/** True when the named wallet has merchant env present (never log secret values). */
export function liveWalletConfigured(provider: WalletProviderId): boolean {
  try {
    if (provider === "esewa") {
      return Boolean(
        process.env.ESEWA_MERCHANT_CODE?.trim() &&
          process.env.ESEWA_SECRET_KEY?.trim(),
      );
    }
    if (provider === "khalti") {
      return Boolean(process.env.KHALTI_SECRET_KEY?.trim());
    }
    return Boolean(
      process.env.CONNECT_IPS_MERCHANT_ID?.trim() &&
        process.env.CONNECT_IPS_APP_ID?.trim() &&
        process.env.CONNECT_IPS_APP_NAME?.trim() &&
        process.env.CONNECT_IPS_SECRET_KEY?.trim(),
    );
  } catch (error) {
    console.error(
      "[providers.ts:liveWalletConfigured]",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Resolve checkout URL for an intent.
 * Live HMAC redirect adapters land in a later Phase 12 step — until then live
 * mode fails closed with a clear config error (no silent stub fallback).
 */
export function resolveCheckoutUrl(
  intentId: string,
  provider: WalletProviderId,
): { checkoutUrl: string } | { error: string } {
  try {
    const mode = payProviderMode();
    if (mode === "off") {
      return { error: "Payments are disabled (PAY_PROVIDER=off)." };
    }
    if (mode === "stub") {
      return { checkoutUrl: stubCheckoutUrl(intentId) };
    }
    if (!liveWalletConfigured(provider)) {
      return {
        error:
          `Live ${walletLabel(provider)} keys are not configured. ` +
          `Set merchant env vars or use PAY_PROVIDER=stub.`,
      };
    }
    return {
      error:
        `Live ${walletLabel(provider)} checkout adapter is not enabled yet. ` +
        `Keep PAY_PROVIDER=stub until Phase 12 HMAC redirect ships.`,
    };
  } catch (error) {
    console.error(
      "[providers.ts:resolveCheckoutUrl]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not resolve checkout URL." };
  }
}
