import Anthropic from "@anthropic-ai/sdk";

/** The model for Hulakico's AI features: customs screening and HS-code suggestions. */
export const CLAUDE_MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;

/** True when ANTHROPIC_API_KEY is set; AI features stay hidden otherwise. */
export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Shared client. One retry and a 60-second limit per attempt, so a slow AI call never holds
 * up a customer for long; callers always have a non-AI path.
 */
export function claudeClient(): Anthropic | null {
  if (!aiEnabled()) return null;
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
}
