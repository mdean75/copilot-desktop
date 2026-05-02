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
  apiProvider: "copilot" | "github-models";
}

// Model IDs must match the Copilot API model identifiers.
// When using the Copilot provider, only models supported by the Copilot API are available.
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
    id: "claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    contextWindow: 200000,
    supportsVision: true,
    tier: "high",
  },
];
