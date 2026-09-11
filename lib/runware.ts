import "server-only";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { GenSize } from "@/lib/app-store/specs";

/**
 * Runware client for the App Store Screens tool.
 *
 *  - Images: Runware's native task API (`POST https://api.runware.ai/v1`,
 *    `taskType: "imageInference"`). Default model is OpenAI GPT Image 2
 *    routed through Runware (`openai:gpt-image@2`), which accepts arbitrary
 *    sizes (edges multiple of 16, 1:3–3:1, 0.65–8.3 MP) and up to 16
 *    reference images.
 *  - Text: Runware's OpenAI-compatible chat completions endpoint, wired into
 *    the Vercel AI SDK through the openai-compatible provider.
 */

export const RUNWARE_API_URL = "https://api.runware.ai/v1";

const envSchema = z.object({
  RUNWARE_API_KEY: z.string().min(1),
  RUNWARE_IMAGE_MODEL: z.string().min(1).default("openai:gpt-image@2"),
  /** Optional override for the app's default text model (constant/models.ts DEFAULT_MODEL). */
  RUNWARE_TEXT_MODEL: z.string().min(1).optional(),
  /** Optional override for the fast/analysis text model (FAST_MODEL). */
  RUNWARE_FAST_TEXT_MODEL: z.string().min(1).optional(),
});

type RunwareEnv = z.infer<typeof envSchema>;
let cachedEnv: RunwareEnv | undefined;

export function getRunwareEnv(): RunwareEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse({
    RUNWARE_API_KEY: process.env.RUNWARE_API_KEY,
    RUNWARE_IMAGE_MODEL: process.env.RUNWARE_IMAGE_MODEL || undefined,
    RUNWARE_TEXT_MODEL: process.env.RUNWARE_TEXT_MODEL || undefined,
    RUNWARE_FAST_TEXT_MODEL: process.env.RUNWARE_FAST_TEXT_MODEL || undefined,
  });
  if (!parsed.success) {
    const keys = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`[Runware] Invalid or missing environment variables: ${keys}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

// ─── Text (OpenAI-compatible) ─────────────────────────────────────────────────

let textProvider: ReturnType<typeof createOpenAICompatible> | undefined;

/**
 * AI SDK language model backed by Runware's chat completions endpoint.
 * Prefer `llm.chat()` from lib/llm.ts, which adds id normalisation and the
 * tool-calling fallback.
 */
export function runwareTextModel(modelId: string) {
  const env = getRunwareEnv();
  if (!textProvider) {
    textProvider = createOpenAICompatible({
      name: "runware",
      baseURL: RUNWARE_API_URL,
      apiKey: env.RUNWARE_API_KEY,
    });
  }
  return textProvider.chatModel(modelId);
}

// ─── Images (native task API) ─────────────────────────────────────────────────

export type ReferenceImage = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

export type GenerateStoreImageArgs = {
  prompt: string;
  references: ReferenceImage[];
  size: GenSize;
  quality: "low" | "medium" | "high";
};

export class ImageGenerationError extends Error {
  status?: number;
  retryable: boolean;
  constructor(message: string, opts: { status?: number; retryable: boolean }) {
    super(message);
    this.name = "ImageGenerationError";
    this.status = opts.status;
    this.retryable = opts.retryable;
  }
}

export function isOpenAIImageModel(model: string) {
  return model.startsWith("openai:");
}

/** Snap a requested size to the 16px grid every Runware image model accepts. */
export function resolveGenerationSize(_model: string, wanted: GenSize): GenSize {
  const snap = (n: number) => Math.max(16, Math.round(n / 16) * 16);
  return { width: snap(wanted.width), height: snap(wanted.height) };
}

type RunwareTaskResult = {
  taskType?: string;
  taskUUID?: string;
  imageUUID?: string;
  imageURL?: string;
  imageBase64Data?: string;
  imageDataURI?: string;
  cost?: number;
  NSFWContent?: boolean;
};

type RunwareErrorItem = { code?: string; message?: string; taskUUID?: string };

function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function errorFromResponse(status: number, body: unknown): ImageGenerationError {
  const b = body as { errors?: RunwareErrorItem[]; error?: RunwareErrorItem | string; message?: string };
  const first =
    b?.errors?.[0] ??
    (typeof b?.error === "object" ? b.error : undefined) ??
    (typeof b?.error === "string" ? { message: b.error } : undefined);
  const message =
    first?.message ||
    b?.message ||
    (status ? `Runware request failed with status ${status}` : "Runware request failed");
  const code = first?.code?.toLowerCase() ?? "";
  const retryable =
    isRetryableStatus(status) || /timeout|rate|overload|unavailable|capacity/.test(code);
  return new ImageGenerationError(`${message}${first?.code ? ` (${first.code})` : ""}`.slice(0, 300), {
    status,
    retryable,
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchImageBytes(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) {
    throw new ImageGenerationError(`Could not download rendered image (${res.status})`, {
      status: res.status,
      retryable: true,
    });
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Render one image through Runware. Reference images (logo, real screenshot,
 * the finished hero) are passed as data URIs in `inputs.referenceImages`.
 * Returns PNG bytes.
 */
export async function generateStoreImage(
  args: GenerateStoreImageArgs,
): Promise<{ png: Buffer; model: string; size: GenSize; cost?: number }> {
  const env = getRunwareEnv();
  const model = env.RUNWARE_IMAGE_MODEL;
  const size = resolveGenerationSize(model, args.size);

  if (args.prompt.length > 30_000) {
    throw new ImageGenerationError("Prompt too long for the image model", { retryable: false });
  }

  const references = args.references
    .slice(0, 16)
    .map((r) => `data:${r.mimeType};base64,${r.buffer.toString("base64")}`);

  const task: Record<string, unknown> = {
    taskType: "imageInference",
    taskUUID: randomUUID(),
    model,
    positivePrompt: args.prompt,
    width: size.width,
    height: size.height,
    numberResults: 1,
    outputType: "base64Data",
    outputFormat: "PNG",
    includeCost: true,
    deliveryMethod: "sync",
  };
  if (references.length > 0) task.inputs = { referenceImages: references };
  if (isOpenAIImageModel(model)) {
    task.providerSettings = { openai: { quality: args.quality } };
  }

  const maxAttempts = 3;
  let lastErr: ImageGenerationError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let res: Response;
      try {
        res = await fetch(RUNWARE_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RUNWARE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([task]),
          signal: AbortSignal.timeout(240_000),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new ImageGenerationError(`Network error calling Runware: ${msg}`.slice(0, 300), {
          retryable: true,
        });
      }

      const body: unknown = await res.json().catch(() => ({}));
      const errors = (body as { errors?: RunwareErrorItem[] })?.errors;
      if (!res.ok || (Array.isArray(errors) && errors.length > 0)) {
        throw errorFromResponse(res.status, body);
      }

      // Envelope is normally { data: [task] }; be lenient about the alternatives.
      const list: RunwareTaskResult[] = Array.isArray((body as { data?: unknown })?.data)
        ? ((body as { data: RunwareTaskResult[] }).data)
        : Array.isArray(body)
          ? (body as RunwareTaskResult[])
          : [body as RunwareTaskResult];
      const result =
        list.find((t) => t.taskType === "imageInference" && (t.imageBase64Data || t.imageDataURI || t.imageURL)) ??
        list[0];

      let png: Buffer | undefined;
      if (result?.imageBase64Data) {
        png = Buffer.from(result.imageBase64Data, "base64");
      } else if (result?.imageDataURI) {
        const comma = result.imageDataURI.indexOf(",");
        png = Buffer.from(result.imageDataURI.slice(comma + 1), "base64");
      } else if (result?.imageURL) {
        png = await fetchImageBytes(result.imageURL);
      }

      if (!png || png.length === 0) {
        throw new ImageGenerationError("Runware returned no image data", { retryable: true });
      }
      return { png, model, size, cost: result?.cost };
    } catch (err) {
      lastErr =
        err instanceof ImageGenerationError
          ? err
          : new ImageGenerationError(
              (err instanceof Error ? err.message : String(err)).slice(0, 300),
              { retryable: false },
            );
      if (!lastErr.retryable || attempt === maxAttempts) break;
      await sleep(2000 * attempt * attempt); // 2s, 8s
    }
  }

  throw lastErr ?? new ImageGenerationError("Image generation failed", { retryable: false });
}
