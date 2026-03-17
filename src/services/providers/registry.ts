/** Provider registry — image provider factory for Takdizang. */

import type { ImageGenerationProvider } from "./types";
import { KieProvider } from "./kie-provider";
import { MockProvider } from "./mock-provider";

export type ProviderKey = "kie" | "mock";

const providers: Record<ProviderKey, () => ImageGenerationProvider> = {
  kie: () => new KieProvider(),
  mock: () => new MockProvider(),
};

let cached: ImageGenerationProvider | null = null;
let cachedKey: string | null = null;

function resolveProviderKey(): ProviderKey {
  if (process.env.USE_MOCK === "true") return "mock";
  return (process.env.IMAGE_PROVIDER as ProviderKey) ?? "kie";
}

/**
 * Get the active image generation provider.
 */
export function getProvider(): ImageGenerationProvider {
  const key = resolveProviderKey();
  if (cached && cachedKey === key) return cached;

  const factory = providers[key];
  if (!factory) {
    throw new Error(
      `Unknown IMAGE_PROVIDER "${key}". Valid: ${Object.keys(providers).join(", ")}`,
    );
  }

  cached = factory();
  cachedKey = key;
  return cached;
}

/**
 * Get a specific provider by name (for explicit override).
 */
export function getProviderByName(name: ProviderKey): ImageGenerationProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(
      `Unknown provider "${name}". Valid: ${Object.keys(providers).join(", ")}`,
    );
  }
  return factory();
}

/**
 * Provider name for GenerationJob.provider field.
 */
export function getProviderLabel(): string {
  const key = resolveProviderKey();
  return key === "mock" ? "mock" : "kie-nano-banana-2";
}

/**
 * Whether the current provider is mock mode.
 */
export function isMockMode(): boolean {
  return resolveProviderKey() === "mock";
}
