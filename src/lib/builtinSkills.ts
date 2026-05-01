import type { Skill } from "../types/skill";

export const BUILTIN_SKILLS: Skill[] = [
  {
    id: "builtin-web-research",
    name: "Web Research",
    description: "Searches the web for current information",
    systemPrompt:
      "You are a helpful research assistant with access to web search. Use the web_search tool to find current, accurate information when needed. Cite your sources.",
    icon: "🔍",
    enabledBuiltinTools: ["web_search"],
    enabledMcpServerIds: [],
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "builtin-github",
    name: "GitHub Context",
    description: "Look up repos, issues, PRs, and code",
    systemPrompt:
      "You are a helpful assistant with access to GitHub. Use the github_search tool to look up repositories, issues, pull requests, and code. Always reference the full repo name (owner/repo) and link to relevant resources.",
    icon: "🐙",
    enabledBuiltinTools: ["github_context"],
    enabledMcpServerIds: [],
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];
