# App Store Screens — feature plan

Generate a consistent set of App Store / Play Store screenshots from a short brief plus
brand assets (logo, real app screenshots, optional style reference), and show the results
on the project canvas. All model calls go through **Runware** (https://runware.ai): the art
direction step uses Runware's OpenAI-compatible chat endpoint, and rendering uses Runware's
image task API with OpenAI GPT Image 2 (`openai:gpt-image@2`) as the default model.

## Goals

1. **One brief → a full, consistent set.** Every screen shares the same background system,
   palette, typography, device treatment and caption placement.
2. **Real assets in, real assets out.** The user's logo and app screenshots are passed to the
   image model as reference inputs so the artwork shows *their* UI, not invented UI.
3. **Store-native sizes.** `gpt-image-2` accepts arbitrary sizes (multiples of 16, ≤3:1 aspect),
   so screens are rendered at the store aspect ratio and exported at exact store dimensions.
4. **Lives on the canvas.** Finished screens are persisted as `CanvasImage` rows, so drag,
   resize, delete and share all work with zero new canvas code paths.
5. **Fair billing.** Credits are charged atomically up front per screen and refunded for
   screens that fail.

## Pipeline

```
brief + assets ──► POST /api/app-store ──► Project(deviceType "app-store") + AppStoreSet
                                           + AppStoreAsset[] + AppStoreScreen[] (pending)
                                           └─► inngest "app-store/generate.set"

Inngest job
  1. art-direct   vision LLM (Runware chat, default google:gemini@3.1-pro) reads brief + logo
                  + screenshots → StyleGuide (palette, background, type, device rules, motif)
                  → per-screen plan (headline, subheadline, visual brief, which screenshot).
                  Plain-JSON reply validated with zod; retried text-only if vision input fails.
  2. hero         Runware imageInference (openai:gpt-image@2) with inputs.referenceImages =
                  logo, screenshot, style ref → PNG → WebP → CanvasImage (slot 0) → screen.done
  3. rest         batches of 3 in parallel; each call gets the HERO OUTPUT as reference #1
                  plus its own screenshot + logo → guarantees set-level consistency
  4. finalize     set.status = completed | failed, refund failed screens
```

Consistency comes from three layers: a frozen JSON style guide rendered into every prompt
("style bible"), the hero image passed as a visual reference to every other screen, and a
strict "match exactly" instruction block in the screen prompt.

## Data model (Prisma / MongoDB)

- `AppStoreSet` — one per project: brief JSON, styleGuide JSON, platform, quality, model,
  status (`planning | generating | completed | failed`), error.
- `AppStoreScreen` — one per screenshot: index, headline, subheadline, visualBrief, prompt
  (final prompt used, for debugging), status (`pending | generating | done | failed`),
  error, canvasImageId, assetId (screenshot used), genWidth/genHeight.
- `AppStoreAsset` — uploaded inputs: kind (`logo | screenshot | reference`), name, src
  (data URL, downscaled with sharp), width, height, order.
- Existing `CanvasImage` holds the rendered output (WebP data URL).

## API

| Route | Purpose |
|---|---|
| `POST /api/app-store` (multipart) | validate brief + files, charge credits, create records, enqueue job |
| `GET /api/app-store/[projectId]` | set status, style guide, screens, asset metadata (polled while active) |
| `POST /api/app-store/[projectId]/regenerate` | re-render one screen with optional instructions (charges 1 screen) |
| `POST /api/app-store/[projectId]/export` | resize a screen to an exact store size, returns PNG |

Auth on every route via `getSession`; ownership via `project.userId`. Credits via the new
atomic `lib/credits.ts` (conditional decrement, no read-then-write race).

## UI

- `/mini-tools/app-store-screens` — brief form: app basics, platform, screen count, key
  moments (one per line → one screen each), brand (logo, colors, tone, style reference),
  app screenshots, quality tier, extra instructions, live credit cost.
- `/project/[id]` for `deviceType === "app-store"`:
  - `AppStoreSidebar` replaces the chat sidebar: status, style guide swatches, screen list
    with regenerate (with instructions) and per-size export/download.
  - Canvas renders skeleton slots for pending/generating/failed screens at the exact slot
    positions the job will fill; finished screens arrive as normal canvas images.
  - Polling every 4 s while the set is active (no dependency on the realtime socket).

## Cost basis

`gpt-image-2` is token-billed; medium quality at ~2.3 MP is roughly $0.10–0.15 per image,
high quality roughly 3–4× that. Plans price 1 credit ≈ $0.018, so per-screen cost is set to
**6 credits (standard / medium)** and **18 credits (premium / high)** in
`lib/app-store/specs.ts`. Tune there.

## Environment

- `RUNWARE_API_KEY` (required) — from https://my.runware.ai
- `RUNWARE_IMAGE_MODEL` optional, defaults to `openai:gpt-image@2`. Any Runware image model
  that accepts reference images works; sizes are snapped to the 16 px grid.
- `RUNWARE_TEXT_MODEL` optional, defaults to `google:gemini@3.1-pro` (needs vision for the
  best palettes; a text-only model still works via the automatic text-only retry).
- The rest of the app still uses `OPENROUTER_API_KEY`; this feature no longer does.
- After pulling: `npx prisma generate`, then `npx prisma db push` from a machine that can reach
  Atlas (creates the new indexes; the app works without them).
