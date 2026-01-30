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

// Auto = use Gemini 3 Pro by default (no GPT or others)
export const AUTO_MODEL_ID = "auto";

/** Models shown in the prompt input dropdown: Auto, Gemini Pro, Gemini Flash, Sonnet (no GPT) */
export const SELECTABLE_MODELS: ModelOption[] = [
  {
    id: AUTO_MODEL_ID,
    name: "Auto",
    provider: "Google",
    description: "Automatically picks the best model for your task",
    useCase: "both",
  },
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "Google",
    description: "Great for creative layouts, exploring visual styles",
    useCase: "both",
  },
  {
    id: "google/gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "Google",
    description: "The fastest, great for dense layouts, apps, quick edits",
    useCase: "analysis",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Latest Claude Sonnet - high quality",
    useCase: "generation",
  },
];

// Fast model for analysis phase (planning screens)
export const FAST_MODEL = "google/gemini-3-flash-preview";

// Quality model for generation phase (creating HTML). Auto resolves to this.
export const DEFAULT_MODEL = "google/gemini-3-pro-preview";

export const getModelName = (modelId: string): string => {
  if (modelId === AUTO_MODEL_ID) return "Auto";
  const model = AI_MODELS.find((m) => m.id === modelId);
  return model?.name || modelId;
};

export const getAnalysisModel = (): string => FAST_MODEL;

/** Resolves user-facing model id to actual API model (Auto → Gemini 3 Pro). */
export const getGenerationModel = (userModel?: string): string =>
  !userModel || userModel === AUTO_MODEL_ID ? DEFAULT_MODEL : userModel;
