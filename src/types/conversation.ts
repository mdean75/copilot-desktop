export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  contentBase64?: string;
  localPath?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  attachments?: Attachment[];
  createdAt: string;
  model?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  activeSkillId?: string;
  model: string;
  pinned: boolean;
}
