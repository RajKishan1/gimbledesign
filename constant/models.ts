export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
  useCase?: "analysis" | "generation" | "both";
}

export const AI_MODELS: ModelOption[] = [
  {
    id: "anthropic/claude-opus-5",
    name: "Claude Opus 5",
    provider: "Anthropic",
    description: "Anthropic's most powerful model - highest quality",
    useCase: "generation",
  },
  {
    id: "anthropic/claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "Anthropic",
    description: "Fast and capable - great balance of speed and quality",
    useCase: "both",
  },
  {
    id: "openai/gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "OpenAI",
    description: "OpenAI's flagship - strong reasoning and generation",
    useCase: "generation",
  },
  {
    id: "google/gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    description: "Advanced Gemini Pro - balanced speed/quality",
    useCase: "both",
  },
  {
    id: "google/gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "Google",
    description: "Fast and efficient - great for analysis",
    useCase: "analysis",
  },
  {
    id: "deepseek/deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    description: "Strong open-weights model with 1M context",
    useCase: "both",
  },
  {
    id: "moonshotai/kimi-k3",
    name: "Kimi K3",
    provider: "Moonshot AI",
    description: "Strong reasoning, vision, and tool-calling",
    useCase: "both",
  },
  {
    id: "qwen/qwen3.8-max",
    name: "Qwen 3.8 Max",
    provider: "Qwen",
    description: "Alibaba's flagship - great for multimodal tasks",
    useCase: "both",
  },
  {
    id: "z-ai/glm-5.3",
    name: "GLM-5.3",
    provider: "Zhipu AI",
    description: "Top coding and agentic model with long context",
    useCase: "both",
  },
];

// Auto = use Gemini 3.1 Pro by default
export const AUTO_MODEL_ID = "auto";

/** Models shown in the prompt input dropdown */
export const SELECTABLE_MODELS: ModelOption[] = [
  {
    id: AUTO_MODEL_ID,
    name: "Auto",
    provider: "Google",
    description: "Automatically picks the best model for your task",
    useCase: "both",
  },
  ...AI_MODELS,
];

// Fast model for analysis phase (planning screens)
export const FAST_MODEL = "google/gemini-3.7-flash";

// Quality model for generation phase (creating HTML). Auto resolves to this.
export const DEFAULT_MODEL = "google/gemini-3.1-pro-preview";

export const getModelName = (modelId: string): string => {
  if (modelId === AUTO_MODEL_ID) return "Auto";
  const model = AI_MODELS.find((m) => m.id === modelId);
  return model?.name || modelId;
};

export const getAnalysisModel = (): string => FAST_MODEL;

/** Resolves user-facing model id to actual API model (Auto → Gemini 3.1 Pro). */
export const getGenerationModel = (userModel?: string): string =>
  !userModel || userModel === AUTO_MODEL_ID ? DEFAULT_MODEL : userModel;
