/**
 * Model catalog. IDs are Runware AIR identifiers (provider:family@version) —
 * every model call in the app goes through Runware (see lib/llm.ts).
 */
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
  useCase?: "analysis" | "generation" | "both";
}

export const AI_MODELS: ModelOption[] = [
  {
    id: "anthropic:claude@opus-5",
    name: "Claude Opus 5",
    provider: "Anthropic",
    description: "Anthropic's most powerful model - highest quality",
    useCase: "generation",
  },
  {
    id: "anthropic:claude@sonnet-4.6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    description: "Fast and capable - great balance of speed and quality",
    useCase: "both",
  },
  {
    id: "openai:gpt@5.5",
    name: "GPT-5.5",
    provider: "OpenAI",
    description: "OpenAI's flagship - strong reasoning and generation",
    useCase: "generation",
  },
  {
    id: "google:gemini@3.1-pro",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    description: "Advanced Gemini Pro - balanced speed/quality",
    useCase: "both",
  },
  {
    id: "google:gemini@3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "Google",
    description: "Fast and efficient - great for analysis",
    useCase: "analysis",
  },
  {
    id: "deepseek:v4@flash",
    name: "DeepSeek V4 Flash",
    provider: "DeepSeek",
    description: "Strong open-weights model, fast and inexpensive",
    useCase: "both",
  },
  {
    id: "zai:glm@4.7",
    name: "GLM-4.7",
    provider: "Z.ai",
    description: "Top coding and agentic model with long context",
    useCase: "both",
  },
  {
    id: "minimax:m2.7@0",
    name: "MiniMax M2.7",
    provider: "MiniMax",
    description: "Efficient open model with strong reasoning",
    useCase: "both",
  },
];

// Auto = use Claude Sonnet 4.6 by default
export const AUTO_MODEL_ID = "auto";

/** Models shown in the prompt input dropdown */
export const SELECTABLE_MODELS: ModelOption[] = [
  {
    id: AUTO_MODEL_ID,
    name: "Auto",
    provider: "Anthropic",
    description: "Automatically picks the best model for your task",
    useCase: "both",
  },
  ...AI_MODELS,
];

// Fast model for analysis phase (planning screens). Multimodal, cheap, and
// returns clean content on Runware.
export const FAST_MODEL = "google:gemini@3.5-flash";

// Quality model for generation phase (creating HTML). Auto resolves to this.
// Claude Sonnet 4.6: clean output, native tool round-trips work on Runware
// (Gemini 3.1 Pro leaks thought summaries into content and rejects tool
// result turns through Runware's OpenAI-compatible layer — see lib/llm.ts).
export const DEFAULT_MODEL = "anthropic:claude@sonnet-4.6";

// Multimodal model for describe-image / heatmap style tasks.
export const VISION_MODEL = "google:gemini@3.5-flash";

/**
 * Old OpenRouter slugs → Runware ids. Users may still have these saved in
 * localStorage ("selectedModel") or in old requests; map them instead of
 * failing.
 */
export const LEGACY_MODEL_IDS: Record<string, string> = {
  "anthropic/claude-opus-5": "anthropic:claude@opus-5",
  "anthropic/claude-sonnet-5": "anthropic:claude@sonnet-4.6",
  "openai/gpt-5.6-sol": "openai:gpt@5.5",
  "openai/gpt-5.4-mini": VISION_MODEL,
  "google/gemini-3.1-pro-preview": "google:gemini@3.1-pro",
  "google/gemini-3.7-flash": FAST_MODEL,
  "deepseek/deepseek-v4-pro": "deepseek:v4@flash",
  "moonshotai/kimi-k3": DEFAULT_MODEL,
  "qwen/qwen3.8-max": DEFAULT_MODEL,
  "z-ai/glm-5.3": "zai:glm@4.7",
};

/** Accepts "auto", a current id, or a legacy OpenRouter slug; returns a Runware id. */
export const normalizeModelId = (modelId?: string | null): string => {
  if (!modelId || modelId === AUTO_MODEL_ID) return DEFAULT_MODEL;
  if (LEGACY_MODEL_IDS[modelId]) return LEGACY_MODEL_IDS[modelId];
  // Anything that doesn't look like an AIR id falls back to the default.
  return /^[a-z0-9-]+:[a-z0-9.-]+@[a-z0-9.-]+$/i.test(modelId) ? modelId : DEFAULT_MODEL;
};

export const getModelName = (modelId: string): string => {
  if (modelId === AUTO_MODEL_ID) return "Auto";
  const id = normalizeModelId(modelId);
  const model = AI_MODELS.find((m) => m.id === id);
  return model?.name || modelId;
};

export const getAnalysisModel = (): string => FAST_MODEL;

/** Resolves user-facing model id to actual API model (Auto → Gemini 3.1 Pro). */
export const getGenerationModel = (userModel?: string): string =>
  normalizeModelId(userModel);
