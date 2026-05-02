import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface CopilotModel {
  id: string;
  name?: string;
  version?: string;
  capabilities?: {
    family?: string;
    limits?: {
      max_output_tokens?: number;
      max_prompt_tokens?: number;
    };
    model_type?: string;
  };
}

interface ModelStore {
  models: CopilotModel[];
  isLoading: boolean;
  error: string | null;
  selectedModel: string;
  fetchModels: (token: string) => Promise<void>;
  setSelectedModel: (modelId: string) => void;
}

const DEFAULT_MODEL = "gpt-4o";

export const useModelStore = create<ModelStore>((set) => ({
  models: [],
  isLoading: false,
  error: null,
  selectedModel: DEFAULT_MODEL,

  fetchModels: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const models = await invoke<CopilotModel[]>("copilot_list_models", {
        githubToken: token,
      });
      // Filter to only chat models if the API provides type info
      const chatModels = models.filter(
        (m) =>
          !m.capabilities?.model_type ||
          m.capabilities.model_type === "chat"
      );
      set({ models: chatModels, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  setSelectedModel: (modelId: string) => {
    set({ selectedModel: modelId });
  },
}));
