import { useCallback } from "react";
import { nanoid } from "nanoid";
import { invoke } from "@tauri-apps/api/core";
import { complete, streamCompletion } from "../lib/githubModelsClient";
import { getToolDefinitions, executeTool, type ToolDefinition } from "../lib/tools";
import { useConversationStore } from "../store/useConversationStore";
import { useSkillStore } from "../store/useSkillStore";
import { useAuthStore } from "../store/useAuthStore";
import { useMcpStore } from "../store/useMcpStore";
import type { ApiMessage } from "../lib/githubModelsClient";
import type { McpTool } from "../types/mcp";

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
  const skillStore = useSkillStore();
  const mcpStore = useMcpStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!token || !store.activeConversation) return;

      const conversation = store.activeConversation;
      const skill = skillStore.activeSkill();

      // Builtin tools from the active skill
      const builtinTools = skill ? getToolDefinitions(skill.enabledBuiltinTools) : [];

      // MCP tools from the skill's enabled MCP servers
      const mcpTools = skill
        ? mcpStore.getToolsForServers(skill.enabledMcpServerIds).map(mcpToolToDefinition)
        : [];

      const tools = [...builtinTools, ...mcpTools];

      store.addMessage({
        id: nanoid(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
        model: conversation.model,
      });

      store.addMessage({
        id: nanoid(),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        model: conversation.model,
      });

      let apiMessages: ApiMessage[] = [
        ...(skill ? [{ role: "system" as const, content: skill.systemPrompt }] : []),
        ...conversation.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content },
      ];

      try {
        if (tools.length > 0) {
          let hasToolCalls = true;
          while (hasToolCalls) {
            const response = await complete(token, conversation.model, apiMessages, tools);
            const msg = response.choices[0].message;

            if (!msg.tool_calls?.length) {
              hasToolCalls = false;
              break;
            }

            apiMessages.push({
              role: "assistant",
              content: msg.content,
              tool_calls: msg.tool_calls,
            });

            for (const call of msg.tool_calls) {
              const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
              let result: string;

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
                }
              } else {
                result = await executeTool(call.function.name, args, token);
              }

              apiMessages.push({
                role: "tool",
                content: result,
                tool_call_id: call.id,
              });
            }
          }
        }

        for await (const chunk of streamCompletion(token, conversation.model, apiMessages)) {
          store.appendToLastMessage(chunk);
        }
      } catch (e) {
        store.appendToLastMessage(`\n\n*Error: ${String(e)}*`);
      }

      await store.finalizeStream();
    },
    [token, store, skillStore, mcpStore]
  );

  return { sendMessage, isStreaming: store.isStreaming };
}
