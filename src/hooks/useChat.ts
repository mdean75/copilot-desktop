import { useCallback } from "react";
import { nanoid } from "nanoid";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getToolDefinitions, executeTool, type ToolDefinition } from "../lib/tools";
import { useConversationStore } from "../store/useConversationStore";
import { useModelStore } from "../store/useModelStore";
import { useAgentStore } from "../store/useAgentStore";
import { useSkillStore } from "../store/useSkillStore";
import { useAuthStore } from "../store/useAuthStore";
import { useMcpStore } from "../store/useMcpStore";
import type { McpTool } from "../types/mcp";
import type { BuiltinToolId } from "../types/agent";

const BUILTIN_TOOL_IDS: BuiltinToolId[] = ["web_search", "github_context", "file_upload"];

interface ApiMessage {
  role: string;
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ApiToolCall[];
}

interface ApiToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

function mcpToolToDefinition(tool: McpTool): ToolDefinition {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema as Record<string, unknown>,
    },
  };
}

export function useChat() {
  const token = useAuthStore((s) => s.token);
  const store = useConversationStore();
  const agentStore = useAgentStore();
  const skillStore = useSkillStore();
  const mcpStore = useMcpStore();
  const selectedModel = useModelStore((s) => s.selectedModel);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!token || !store.activeConversation) return;

      const conversation = store.activeConversation;
      // Use the currently selected model (allows switching mid-conversation)
      const model = selectedModel || conversation.model;
      const agent = agentStore.activeAgent();
      const activeSkill = skillStore.activeSkill();

      // Builtin tools from agent + skill allowed-tools
      const agentBuiltinTools = agent ? agent.enabledBuiltinTools : [];
      const skillBuiltinTools = (activeSkill?.allowedTools ?? [])
        .filter((t): t is BuiltinToolId => BUILTIN_TOOL_IDS.includes(t as BuiltinToolId));
      const allBuiltinToolIds = [...new Set([...agentBuiltinTools, ...skillBuiltinTools])];
      const builtinTools = getToolDefinitions(allBuiltinToolIds);

      // MCP tools: agent-scoped if an agent is active, otherwise all running servers
      const mcpServerIds = agent
        ? agent.enabledMcpServerIds
        : mcpStore.serverStates.filter((s) => s.status === "running").map((s) => s.config.id);
      const mcpTools = mcpStore.getToolsForServers(mcpServerIds).map(mcpToolToDefinition);

      const tools = [...builtinTools, ...mcpTools];

      store.addMessage({
        id: nanoid(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
        model,
      });

      const assistantMsgId = nanoid();
      store.addMessage({
        id: assistantMsgId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        model,
      });

      // Build system prompt: agent first, then skill body appended
      const systemParts = [
        agent?.systemPrompt,
        activeSkill?.body,
      ].filter(Boolean) as string[];
      const systemPrompt = systemParts.join("\n\n");

      let apiMessages: ApiMessage[] = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        ...conversation.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content ?? null })),
        { role: "user" as const, content },
      ];

      try {
        const displayToolCalls: NonNullable<import("../types/conversation").Message["toolCalls"]> = [];
        const displayToolResults: NonNullable<import("../types/conversation").Message["toolResults"]> = [];

        // Tool-calling loop (non-streaming via Rust backend)
        if (tools.length > 0) {
          let hasToolCalls = true;
          while (hasToolCalls) {
            const response = await invoke<{ choices: Array<{ message: { role: string; content: string | null; tool_calls?: ApiToolCall[] }; finish_reason: string }> }>("copilot_complete", {
              githubToken: token,
              model,
              messages: apiMessages,
              tools,
            });
            const msg = response.choices[0].message;

            if (!msg.tool_calls?.length) {
              hasToolCalls = false;
              break;
            }

            apiMessages.push({
              role: "assistant",
              content: msg.content ?? null,
              tool_calls: msg.tool_calls,
            });

            for (const call of msg.tool_calls) {
              const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
              let result: string;
              let isError = false;

              // Route to MCP or builtin executor
              const mcpServerId = mcpStore.findServerForTool(call.function.name);
              if (mcpServerId) {
                try {
                  result = await invoke<string>("call_mcp_tool", {
                    serverId: mcpServerId,
                    toolName: call.function.name,
                    arguments: args,
                  });
                } catch (e) {
                  result = `Tool error: ${String(e)}`;
                  isError = true;
                }
              } else {
                result = await executeTool(call.function.name, args, token);
              }

              displayToolCalls.push({
                id: call.id,
                type: "function",
                function: { name: call.function.name, arguments: call.function.arguments },
              });
              displayToolResults.push({ toolCallId: call.id, content: result, isError });

              apiMessages.push({
                role: "tool",
                content: result,
                tool_call_id: call.id,
              });
            }
          }
        }

        if (displayToolCalls.length > 0) {
          store.updateMessageTools(assistantMsgId, displayToolCalls, displayToolResults);
        }

        // Streaming final response via Rust backend + events
        const requestId = nanoid();

        const chunkUnlisten = await listen<string>(`copilot://stream-chunk/${requestId}`, (event) => {
          store.appendToLastMessage(event.payload);
        });

        const donePromise = new Promise<void>((resolve) => {
          listen<void>(`copilot://stream-done/${requestId}`, () => {
            resolve();
          }).then((unlisten) => {
            // Store unlisten to clean up after done
            donePromise.then(() => unlisten());
          });
        });

        await invoke("copilot_stream", {
          githubToken: token,
          model,
          messages: apiMessages,
          requestId,
        });

        await donePromise;
        chunkUnlisten();
      } catch (e) {
        store.appendToLastMessage(`\n\n*Error: ${String(e)}*`);
      }

      await store.finalizeStream();
    },
    [token, store, agentStore, skillStore, mcpStore, selectedModel]
  );

  return { sendMessage, isStreaming: store.isStreaming };
}
