/** Mock provider — returns placeholder images for API-key-free testing. */

import type {
  ImageGenerationProvider,
  TextToImageRequest,
  TextToImageResult,
  RemoveBgRequest,
  RemoveBgResult,
} from "./types";

/**
 * Generates a 1×1 colored SVG data-URI as a placeholder image.
 * Color is deterministic per prompt for consistent test results.
 */
function placeholderDataUri(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const hue = ((hash % 360) + 360) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" fill="hsl(${hue},60%,70%)"/>
    <text x="256" y="256" text-anchor="middle" dominant-baseline="central"
      font-family="sans-serif" font-size="24" fill="#333">[MOCK]</text>
  </svg>`;
  const encoded = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

export class MockProvider implements ImageGenerationProvider {
  name = "mock";

  async textToImage(req: TextToImageRequest): Promise<TextToImageResult> {
    // Simulate small network delay
    await delay(300);
    return {
      imageUrls: [placeholderDataUri(req.prompt)],
    };
  }

  async removeBackground(req: RemoveBgRequest): Promise<RemoveBgResult> {
    await delay(200);
    // Return same image — mock doesn't actually remove bg
    return {
      imageUrls: [req.imageUrl],
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
