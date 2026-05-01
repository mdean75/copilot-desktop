import { create } from "zustand";
import { nanoid } from "nanoid";
import { invoke } from "@tauri-apps/api/core";
import type { McpServerConfig, McpServerState, McpTool } from "../types/mcp";
import * as storage from "../lib/storage";

interface McpStore {
  serverStates: McpServerState[];

  load: () => Promise<void>;
  addServer: (
    draft: Omit<McpServerConfig, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  removeServer: (id: string) => Promise<void>;
  startServer: (id: string) => Promise<void>;
  stopServer: (id: string) => Promise<void>;
  getToolsForServers: (serverIds: string[]) => McpTool[];
  findServerForTool: (toolName: string) => string | undefined;
}

export const useMcpStore = create<McpStore>((set, get) => ({
  serverStates: [],

  load: async () => {
    const configs = await storage.listMcpServers();
    // Start with all stopped
    const states: McpServerState[] = configs.map((config) => ({
      config,
      status: "stopped",
      availableTools: [],
    }));
    set({ serverStates: states });

    // Try to start each server
    for (const state of states) {
      get().startServer(state.config.id).catch(() => {
        // Silently mark as error — startServer already handles that
      });
    }
  },

  addServer: async (draft) => {
    const now = new Date().toISOString();
    const config: McpServerConfig = {
      ...draft,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    };
    await storage.saveMcpServer(config);
    set((s) => ({
      serverStates: [
        ...s.serverStates,
        { config, status: "stopped", availableTools: [] },
      ],
    }));
    // Auto-start after adding
    await get().startServer(config.id);
  },

  removeServer: async (id) => {
    await get().stopServer(id);
    await storage.deleteMcpServer(id);
    set((s) => ({
      serverStates: s.serverStates.filter((s) => s.config.id !== id),
    }));
  },

  startServer: async (id) => {
    const state = get().serverStates.find((s) => s.config.id === id);
    if (!state) return;

    set((s) => ({
      serverStates: s.serverStates.map((ss) =>
        ss.config.id === id ? { ...ss, status: "starting", errorMessage: undefined } : ss
      ),
    }));

    try {
      const { config } = state;
      const tools = await invoke<{ name: string; description: string; inputSchema: Record<string, unknown> }[]>(
        "start_mcp_server",
        {
          id,
          command: config.command ?? "",
          args: config.args ?? [],
          env: config.env ?? {},
        }
      );

      const availableTools: McpTool[] = tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema ?? {},
      }));

      set((s) => ({
        serverStates: s.serverStates.map((ss) =>
          ss.config.id === id
            ? { ...ss, status: "running", availableTools }
            : ss
        ),
      }));
    } catch (e) {
      set((s) => ({
        serverStates: s.serverStates.map((ss) =>
          ss.config.id === id
            ? { ...ss, status: "error", errorMessage: String(e) }
            : ss
        ),
      }));
    }
  },

  stopServer: async (id) => {
    try {
      await invoke("stop_mcp_server", { id });
    } catch {
      // Best effort
    }
    set((s) => ({
      serverStates: s.serverStates.map((ss) =>
        ss.config.id === id
          ? { ...ss, status: "stopped", availableTools: [] }
          : ss
      ),
    }));
  },

  getToolsForServers: (serverIds) => {
    return get()
      .serverStates.filter(
        (ss) => serverIds.includes(ss.config.id) && ss.status === "running"
      )
      .flatMap((ss) => ss.availableTools);
  },

  findServerForTool: (toolName) => {
    const state = get().serverStates.find(
      (ss) => ss.status === "running" && ss.availableTools.some((t) => t.name === toolName)
    );
    return state?.config.id;
  },
}));
