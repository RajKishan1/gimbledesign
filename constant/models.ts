export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
  useCase?: "analysis" | "generation" | "both";
}

export const AI_MODELS: ModelOption[] = [
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Latest Claude Sonnet model - high quality",
    useCase: "generation",
  },
  {
    id: "google/gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "Google",
    description: "Fast and efficient - great for analysis",
    useCase: "analysis",
  },
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "Google",
    description: "Advanced Gemini Pro - balanced speed/quality",
    useCase: "both",
  },
];

// Fast model for analysis phase (planning screens)
export const FAST_MODEL = "google/gemini-3-flash-preview";

// Quality model for generation phase (creating HTML)
export const DEFAULT_MODEL = "google/gemini-3-pro-preview";

export const getModelName = (modelId: string): string => {
  const model = AI_MODELS.find((m) => m.id === modelId);
  return model?.name || modelId;
};

export const getAnalysisModel = (): string => FAST_MODEL;
export const getGenerationModel = (userModel?: string): string => userModel || DEFAULT_MODEL;
