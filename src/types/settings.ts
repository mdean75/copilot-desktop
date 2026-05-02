export interface GitHubUser {
  login: string;
  name: string;
  avatarUrl: string;
  hasCopilot: boolean;
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
