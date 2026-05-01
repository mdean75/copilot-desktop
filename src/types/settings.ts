export interface GitHubUser {
  login: string;
  name: string;
  avatarUrl: string;
  hasCopilot: boolean;
}

export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  contextWindow: number;
  supportsVision: boolean;
  tier: "low" | "high";
}

export interface AppSettings {
  version: 1;
  defaultModel: string;
  theme: "light" | "dark" | "system";
  sendOnEnter: boolean;
  streamResponses: boolean;
  dataDir: string;
}

// Model IDs must match GitHub Models API exactly (no provider prefix).
// Available models: https://github.com/marketplace/models
export const MODELS: ModelOption[] = [
  {
    id: "gpt-4o",
    label: "GPT-4o (Recommended)",
    provider: "OpenAI",
    contextWindow: 128000,
    supportsVision: true,
    tier: "high",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o Mini (Fast)",
    provider: "OpenAI",
    contextWindow: 128000,
    supportsVision: true,
    tier: "low",
  },
  {
    id: "o3-mini",
    label: "o3 Mini (Reasoning)",
    provider: "OpenAI",
    contextWindow: 128000,
    supportsVision: false,
    tier: "high",
  },
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    label: "Llama 3.3 70B",
    provider: "Meta",
    contextWindow: 128000,
    supportsVision: false,
    tier: "high",
  },
  {
    id: "mistral-large-2411",
    label: "Mistral Large",
    provider: "Mistral",
    contextWindow: 128000,
    supportsVision: false,
    tier: "high",
  },
];
