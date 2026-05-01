import { useCallback } from "react";
import { nanoid } from "nanoid";
import { complete, streamCompletion } from "../lib/githubModelsClient";
import { getToolDefinitions, executeTool } from "../lib/tools";
import { useConversationStore } from "../store/useConversationStore";
import { useSkillStore } from "../store/useSkillStore";
import { useAuthStore } from "../store/useAuthStore";
import type { ApiMessage } from "../lib/githubModelsClient";

export function useChat() {
  const token = useAuthStore((s) => s.token);
  const store = useConversationStore();
  const skillStore = useSkillStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!token || !store.activeConversation) return;

      const conversation = store.activeConversation;
      const skill = skillStore.activeSkill();
      const tools = skill ? getToolDefinitions(skill.enabledBuiltinTools) : [];

      // Add user message to store
      store.addMessage({
        id: nanoid(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
        model: conversation.model,
      });

      // Add empty assistant placeholder
      store.addMessage({
        id: nanoid(),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        model: conversation.model,
      });

      // Build API messages (snapshot before tool loop)
      let apiMessages: ApiMessage[] = [
        ...(skill ? [{ role: "system" as const, content: skill.systemPrompt }] : []),
        ...conversation.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content },
      ];

      try {
        // Tool-calling loop (non-streaming rounds)
        if (tools.length > 0) {
          let hasToolCalls = true;
          while (hasToolCalls) {
            const response = await complete(token, conversation.model, apiMessages, tools);
            const msg = response.choices[0].message;

            if (!msg.tool_calls?.length) {
              hasToolCalls = false;
              break;
            }

            // Append assistant tool-call message
            apiMessages.push({
              role: "assistant",
              content: msg.content,
              tool_calls: msg.tool_calls,
            });

            // Execute each tool and append results
            for (const call of msg.tool_calls) {
              const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
              const result = await executeTool(call.function.name, args, token);
              apiMessages.push({
                role: "tool",
                content: result,
                tool_call_id: call.id,
              });
            }
          }
        }

        // Stream final response
        for await (const chunk of streamCompletion(token, conversation.model, apiMessages)) {
          store.appendToLastMessage(chunk);
        }
      } catch (e) {
        store.appendToLastMessage(`\n\n*Error: ${String(e)}*`);
      }

      await store.finalizeStream();
    },
    [token, store, skillStore]
  );

  return { sendMessage, isStreaming: store.isStreaming };
}
