import type { ToolDefinition } from "./tools";

const BASE_URL = "https://models.inference.ai.azure.com";

export interface ApiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ApiToolCall[];
}

export interface ApiToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface CompletionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: ApiToolCall[];
    };
    finish_reason: string;
  }>;
}

// Non-streaming — used for tool-calling rounds
export async function complete(
  token: string,
  model: string,
  messages: ApiMessage[],
  tools?: ToolDefinition[]
): Promise<CompletionResponse> {
  const body: Record<string, unknown> = { model, messages };
  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Streaming — used for the final answer (no tools expected)
export async function* streamCompletion(
  token: string,
  model: string,
  messages: ApiMessage[]
): AsyncGenerator<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ model, messages, stream: true }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}
