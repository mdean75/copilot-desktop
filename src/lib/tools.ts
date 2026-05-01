import type { BuiltinToolId } from "../types/skill";

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export const TOOL_DEFINITIONS: Record<BuiltinToolId, ToolDefinition> = {
  web_search: {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information on a topic.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  },
  github_context: {
    type: "function",
    function: {
      name: "github_search",
      description: "Search GitHub for repositories, issues, pull requests, or code.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          type: {
            type: "string",
            enum: ["repositories", "issues", "code"],
            description: "Type of GitHub content to search",
          },
        },
        required: ["query", "type"],
      },
    },
  },
  file_upload: {
    type: "function",
    function: {
      name: "file_upload",
      description: "Read an uploaded file's content.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string" },
        },
        required: ["filename"],
      },
    },
  },
};

export function getToolDefinitions(toolIds: BuiltinToolId[]): ToolDefinition[] {
  return toolIds.map((id) => TOOL_DEFINITIONS[id]);
}

// ── Tool execution ──────────────────────────────────────────────────────────

const BRAVE_API_KEY = import.meta.env.VITE_BRAVE_SEARCH_API_KEY as string | undefined;

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  githubToken: string
): Promise<string> {
  switch (name) {
    case "web_search":
      return executeWebSearch(args.query as string);
    case "github_search":
      return executeGitHubSearch(
        args.query as string,
        args.type as string,
        githubToken
      );
    default:
      return `Unknown tool: ${name}`;
  }
}

async function executeWebSearch(query: string): Promise<string> {
  if (!BRAVE_API_KEY) {
    return (
      "Web search is not configured. Add VITE_BRAVE_SEARCH_API_KEY to your .env file " +
      "(get a free key at https://api.search.brave.com)."
    );
  }
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
    const res = await fetch(url, {
      headers: { "X-Subscription-Token": BRAVE_API_KEY, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Brave API ${res.status}`);
    const data = await res.json();
    const results = (data.web?.results ?? []) as Array<{
      title: string;
      url: string;
      description: string;
    }>;
    if (results.length === 0) return "No results found.";
    return results
      .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.description}`)
      .join("\n\n");
  } catch (e) {
    return `Search failed: ${String(e)}`;
  }
}

async function executeGitHubSearch(
  query: string,
  type: string,
  token: string
): Promise<string> {
  try {
    const endpoint =
      type === "code"
        ? "https://api.github.com/search/code"
        : type === "issues"
        ? "https://api.github.com/search/issues"
        : "https://api.github.com/search/repositories";

    const res = await fetch(
      `${endpoint}?q=${encodeURIComponent(query)}&per_page=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    const items = (data.items ?? []) as Array<Record<string, unknown>>;
    if (items.length === 0) return "No results found on GitHub.";

    return items
      .map((item, i) => {
        if (type === "repositories") {
          return `${i + 1}. **${item.full_name}** ⭐${item.stargazers_count}\n   ${item.html_url}\n   ${item.description ?? "No description"}`;
        }
        if (type === "issues") {
          return `${i + 1}. **${item.title}** [${item.state}]\n   ${item.html_url}`;
        }
        return `${i + 1}. ${item.path} in ${(item.repository as Record<string, unknown>)?.full_name}\n   ${item.html_url}`;
      })
      .join("\n\n");
  } catch (e) {
    return `GitHub search failed: ${String(e)}`;
  }
}
