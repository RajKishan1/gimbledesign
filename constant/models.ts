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
    id: "google:gemini@3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "Google",
    description: "Google's newest Flash model for long-horizon design work",
    useCase: "both",
  },
  {
    id: "openai:gpt@5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "OpenAI",
    description: "OpenAI's flagship for the most demanding design tasks",
    useCase: "generation",
  },
  {
    id: "openai:gpt@5.6-terra",
    name: "GPT-5.6 Terra",
    provider: "OpenAI",
    description: "Strong design quality with balanced speed and cost",
    useCase: "both",
  },
  {
    id: "openai:gpt@5.6-luna",
    name: "GPT-5.6 Luna",
    provider: "OpenAI",
    description: "Fast, cost-efficient generation for high-volume work",
    useCase: "both",
  },
  {
    id: "anthropic:claude@fable-5",
    name: "Claude Fable 5",
    provider: "Anthropic",
    description: "Frontier multimodal model for long-horizon creative work",
    useCase: "generation",
  },
  {
    id: "zai:glm@5.3",
    name: "GLM-5.3",
    provider: "Z.ai",
    description: "Latest GLM flagship for coding and agentic generation",
    useCase: "both",
  },
  {
    id: "moonshotai:kimi@k3",
    name: "Kimi K3",
    provider: "Moonshot AI",
    description: "Frontier multimodal reasoning for complex design workflows",
    useCase: "both",
  },
  {
    id: "minimax:m3@0",
    name: "MiniMax M3",
    provider: "MiniMax",
    description: "Latest MiniMax model for multimodal agentic generation",
    useCase: "both",
  },
  {
    id: "deepseek:v4.1@flash",
    name: "DeepSeek V4.1 Flash",
    provider: "DeepSeek",
    description: "Efficient multimodal model with a long context window",
    useCase: "both",
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
  "openai/gpt-5.6-sol": "openai:gpt@5.6-sol",
  "openai/gpt-5.4-mini": VISION_MODEL,
  "google/gemini-3.1-pro-preview": "google:gemini@3.1-pro",
  "google/gemini-3.7-flash": "google:gemini@3.8-flash",
  "deepseek/deepseek-v4-pro": "deepseek:v4@pro",
  "moonshotai/kimi-k3": "moonshotai:kimi@k3",
  "qwen/qwen3.8-max": DEFAULT_MODEL,
  "z-ai/glm-5.3": "zai:glm@5.3",
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

/** Resolves user-facing model id to actual API model (Auto → Claude Sonnet 4.6). */
export const getGenerationModel = (userModel?: string): string =>
  normalizeModelId(userModel);
