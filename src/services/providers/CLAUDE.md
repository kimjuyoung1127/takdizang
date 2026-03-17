# providers/

Image generation provider abstraction layer.

## Files
- `types.ts`: Provider interface + request/result types
- `registry.ts`: Provider factory (kie + mock)
- `kie-provider.ts`: Kie.ai wrapper (Nano Banana 2 + recraft/remove-background)
- `mock-provider.ts`: Mock provider for API-key-free testing (placeholder SVG images)

## Mock Mode
Set `USE_MOCK=true` in `.env.local` to activate mock mode. This:
- Routes image generation to `MockProvider` (returns colored SVG placeholders)
- Routes marketing-script generation to hardcoded Korean sample text
- Text generation (`/generate`) already has a built-in `brief-parser` fallback
- All other flows (CRUD, upload, export) work normally with Supabase only

## Convention
- All providers implement `ImageGenerationProvider` interface.
- Routes call `getProvider()` from registry — never import providers directly.
- Use `isMockMode()` to check if mock mode is active.
- The default image provider is Kie.ai; override with `USE_MOCK=true` or `IMAGE_PROVIDER=mock`.
- Original service files (`kie-generator.ts`, `removebg-service.ts`) are preserved for backward compatibility.
