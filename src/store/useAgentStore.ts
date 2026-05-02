import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Agent, BuiltinToolId } from "../types/agent";
import { BUILTIN_AGENTS } from "../lib/builtinAgents";
import * as storage from "../lib/storage";

interface AgentStore {
  userAgents: Agent[];
  activeAgentId: string | null;

  allAgents: () => Agent[];
  activeAgent: () => Agent | undefined;
  load: () => Promise<void>;
  create: (draft: {
    name: string;
    description: string;
    systemPrompt: string;
    icon: string;
    enabledBuiltinTools: BuiltinToolId[];
    enabledMcpServerIds: string[];
    starterPrompt?: string;
  }) => Promise<void>;
  update: (agent: Agent) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setActive: (id: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  userAgents: [],
  activeAgentId: null,

  allAgents: () => [...BUILTIN_AGENTS, ...get().userAgents],

  activeAgent: () => get().allAgents().find((a) => a.id === get().activeAgentId),

  load: async () => {
    const userAgents = await storage.listAgents();
    set({ userAgents });
  },

  create: async (draft) => {
    const now = new Date().toISOString();
    const agent: Agent = {
      ...draft,
      id: nanoid(),
      isBuiltin: false,
      createdAt: now,
      updatedAt: now,
    };
    await storage.saveAgent(agent);
    set((s) => ({ userAgents: [...s.userAgents, agent] }));
  },

  update: async (agent) => {
    const updated = { ...agent, updatedAt: new Date().toISOString() };
    await storage.saveAgent(updated);
    set((s) => ({
      userAgents: s.userAgents.map((a) => (a.id === updated.id ? updated : a)),
    }));
  },

  remove: async (id) => {
    await storage.deleteAgent(id);
    set((s) => ({
      userAgents: s.userAgents.filter((a) => a.id !== id),
      activeAgentId: s.activeAgentId === id ? null : s.activeAgentId,
    }));
  },

  setActive: (id) => set({ activeAgentId: id }),
}));
