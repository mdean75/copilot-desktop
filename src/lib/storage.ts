import { invoke } from "@tauri-apps/api/core";
import type { Conversation } from "../types/conversation";
import type { Agent } from "../types/agent";
import type { FsSkill } from "../types/skill";
import type { AppSettings } from "../types/settings";

export async function saveConversation(conversation: Conversation): Promise<void> {
  await invoke("save_conversation", { id: conversation.id, data: conversation });
}

export async function loadConversation(id: string): Promise<Conversation> {
  return invoke<Conversation>("load_conversation", { id });
}

export async function deleteConversation(id: string): Promise<void> {
  await invoke("delete_conversation", { id });
}

export async function listConversations(): Promise<Omit<Conversation, "messages">[]> {
  return invoke("list_conversations");
}

export async function saveAgent(agent: Agent): Promise<void> {
  await invoke("save_agent", { id: agent.id, data: agent });
}

export async function deleteAgent(id: string): Promise<void> {
  await invoke("delete_agent", { id });
}

export async function listAgents(): Promise<Agent[]> {
  return invoke("list_agents");
}

export async function listFsSkills(): Promise<FsSkill[]> {
  return invoke("list_fs_skills");
}

export async function saveMcpServer(server: import("../types/mcp").McpServerConfig): Promise<void> {
  await invoke("save_mcp_server", { id: server.id, data: server });
}

export async function deleteMcpServer(id: string): Promise<void> {
  await invoke("delete_mcp_server", { id });
}

export async function listMcpServers(): Promise<import("../types/mcp").McpServerConfig[]> {
  return invoke("list_mcp_servers");
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await invoke("save_settings", { data: settings });
}

export async function loadSettings(): Promise<AppSettings | null> {
  return invoke("load_settings");
}
