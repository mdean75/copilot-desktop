import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface CopilotModel {
  id: string;
  name?: string;
  version?: string;
  model_picker_enabled?: boolean;
  preview?: boolean;
  policy?: {
    state?: string;
  };
  capabilities?: {
    family?: string;
    type?: string;
    limits?: {
      max_output_tokens?: number;
      max_prompt_tokens?: number;
    };
  };
}

interface ModelStore {
  models: CopilotModel[];
  rawModels: CopilotModel[];
  isLoading: boolean;
  error: string | null;
  selectedModel: string;
  fetchModels: (token: string) => Promise<void>;
  setSelectedModel: (modelId: string) => void;
}

const DEFAULT_MODEL = "gpt-4o";

export const useModelStore = create<ModelStore>((set) => ({
  models: [],
  rawModels: [],
  isLoading: false,
  error: null,
  selectedModel: DEFAULT_MODEL,

  fetchModels: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const models = await invoke<CopilotModel[]>("copilot_list_models", {
        githubToken: token,
      });
      // Keep only models the user's account can actually use
      const availableModels = models.filter(
        (m) =>
          m.model_picker_enabled === true &&
          m.policy?.state === "enabled"
      );

      // Deduplicate by family: prefer the alias (no date suffix) over versioned snapshots.
      const DATE_SUFFIX = /-\d{4}-\d{2}-\d{2}$/;
      const seen = new Map<string, CopilotModel>();
      for (const m of availableModels) {
        const family = m.capabilities?.family ?? m.id;
        const existing = seen.get(family);
        const isAlias = !DATE_SUFFIX.test(m.id);
        if (!existing || isAlias) {
          seen.set(family, m);
        }
      }
      const dedupedModels = Array.from(seen.values());

      set({ models: dedupedModels, rawModels: models, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  setSelectedModel: (modelId: string) => {
    set({ selectedModel: modelId });
  },
}));
