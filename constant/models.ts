export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

export const AI_MODELS: ModelOption[] = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Latest GPT-4 optimized model",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Faster and more affordable GPT-4",
  },
  {
    id: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    description: "High-performance GPT-4 variant",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude Sonnet 3.5",
    provider: "Anthropic",
    description: "Powerful Claude Sonnet model",
  },
  {
    id: "anthropic/claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    description: "Latest Claude Sonnet model",
  },
  {
    id: "google/gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Fast and efficient Gemini model",
  },
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "Google",
    description: "Advanced Gemini Pro model",
  },
];

export const DEFAULT_MODEL = "google/gemini-3-pro-preview";

export const getModelName = (modelId: string): string => {
  const model = AI_MODELS.find((m) => m.id === modelId);
  return model?.name || modelId;
};
