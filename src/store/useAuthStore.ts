import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { GitHubUser } from "../types/settings";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string;

interface DeviceFlow {
  userCode: string;
  verificationUri: string;
}

interface AuthStore {
  user: GitHubUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  deviceFlow: DeviceFlow | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  deviceFlow: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await invoke<string | null>("get_token");
      if (token) {
        const user = await fetchGitHubUser(token);
        set({ user, token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  signIn: async () => {
    set({ isLoading: true, error: null, deviceFlow: null });
    try {
      const flow = await invoke<DeviceFlow>("start_device_auth", {
        clientId: GITHUB_CLIENT_ID,
      });

      set({ deviceFlow: flow, isLoading: false });

      // Open verification URL in default browser
      await openUrl(flow.verificationUri);

      // Listen for the background thread to finish polling
      const unlistenReady = await listen<string>("auth://token-ready", async (event) => {
        unlistenReady();
        unlistenError();
        try {
          const token = event.payload;
          await invoke("store_token", { token });
          const user = await fetchGitHubUser(token);
          set({ user, token, deviceFlow: null, isLoading: false });
        } catch (e) {
          set({ error: String(e), deviceFlow: null, isLoading: false });
        }
      });

      const unlistenError = await listen<string>("auth://token-error", (event) => {
        unlistenReady();
        unlistenError();
        set({ error: event.payload, deviceFlow: null, isLoading: false });
      });
    } catch (e) {
      set({ error: String(e), deviceFlow: null, isLoading: false });
    }
  },

  signOut: async () => {
    await invoke("delete_token").catch(() => {});
    await invoke("clear_copilot_token").catch(() => {});
    set({ user: null, token: null, error: null, deviceFlow: null });
  },
}));

async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error("Failed to fetch GitHub user");
  const data = await res.json();
  return {
    login: data.login,
    name: data.name ?? data.login,
    avatarUrl: data.avatar_url,
    hasCopilot: true,
  };
}
