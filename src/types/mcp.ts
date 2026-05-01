export type McpTransport = "stdio" | "sse";
export type McpServerStatus = "stopped" | "starting" | "running" | "error";

export interface McpServerConfig {
  id: string;
  displayName: string;
  transport: McpTransport;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  isCurated: boolean;
  curatedSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpServerState {
  config: McpServerConfig;
  status: McpServerStatus;
  errorMessage?: string;
  availableTools: McpTool[];
}
