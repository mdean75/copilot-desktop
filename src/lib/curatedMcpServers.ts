export interface CuratedEnvField {
  key: string;
  label: string;
  placeholder: string;
  sensitive?: boolean;
}

export interface CuratedArgField {
  key: string;
  label: string;
  placeholder: string;
}

export interface CuratedServer {
  slug: string;
  displayName: string;
  description: string;
  icon: string;
  command: string;
  baseArgs: string[];
  envFields: CuratedEnvField[];
  argFields: CuratedArgField[];
}

export const CURATED_MCP_SERVERS: CuratedServer[] = [
  {
    slug: "filesystem",
    displayName: "Filesystem",
    description: "Read and write files in a local directory",
    icon: "📁",
    command: "npx",
    baseArgs: ["-y", "@modelcontextprotocol/server-filesystem"],
    envFields: [],
    argFields: [
      {
        key: "path",
        label: "Directory path",
        placeholder: "/Users/you/Documents",
      },
    ],
  },
  {
    slug: "github",
    displayName: "GitHub",
    description: "Browse repos, issues, pull requests, and file contents",
    icon: "🐙",
    command: "npx",
    baseArgs: ["-y", "@modelcontextprotocol/server-github"],
    envFields: [
      {
        key: "GITHUB_PERSONAL_ACCESS_TOKEN",
        label: "GitHub Personal Access Token",
        placeholder: "ghp_...",
        sensitive: true,
      },
    ],
    argFields: [],
  },
  {
    slug: "notion",
    displayName: "Notion",
    description: "Read and create Notion pages and databases",
    icon: "📝",
    command: "npx",
    baseArgs: ["-y", "@notionhq/notion-mcp-server"],
    envFields: [
      {
        key: "OPENAPI_MCP_HEADERS",
        label: "Notion Integration Token (as JSON header)",
        placeholder: '{"Authorization": "Bearer secret_..."}',
        sensitive: true,
      },
    ],
    argFields: [],
  },
  {
    slug: "slack",
    displayName: "Slack",
    description: "Read messages and post to Slack channels",
    icon: "💬",
    command: "npx",
    baseArgs: ["-y", "@modelcontextprotocol/server-slack"],
    envFields: [
      {
        key: "SLACK_BOT_TOKEN",
        label: "Slack Bot Token",
        placeholder: "xoxb-...",
        sensitive: true,
      },
      {
        key: "SLACK_TEAM_ID",
        label: "Slack Team ID",
        placeholder: "T01234ABCDE",
      },
    ],
    argFields: [],
  },
  {
    slug: "jira",
    displayName: "Jira / Confluence",
    description: "Search issues, read pages, and manage Jira tickets",
    icon: "🎯",
    command: "uvx",
    baseArgs: ["mcp-atlassian"],
    envFields: [
      {
        key: "JIRA_URL",
        label: "Jira URL",
        placeholder: "https://yourcompany.atlassian.net",
      },
      {
        key: "JIRA_USERNAME",
        label: "Atlassian email",
        placeholder: "you@company.com",
      },
      {
        key: "JIRA_API_TOKEN",
        label: "Atlassian API token",
        placeholder: "ATATT3x...",
        sensitive: true,
      },
    ],
    argFields: [],
  },
];
