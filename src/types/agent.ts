export type BuiltinToolId = "web_search" | "github_context" | "file_upload";

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  enabledBuiltinTools: BuiltinToolId[];
  enabledMcpServerIds: string[];
  starterPrompt?: string;
  isBuiltin: boolean;
  createdAt: string;
  updatedAt: string;
}
