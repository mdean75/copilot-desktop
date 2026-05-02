import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Conversation, Message } from "../types/conversation";
import * as storage from "../lib/storage";

interface ConversationStore {
  conversations: Omit<Conversation, "messages">[];
  activeConversation: Conversation | null;
  isStreaming: boolean;

  load: () => Promise<void>;
  create: (model: string) => Promise<Conversation>;
  open: (id: string) => Promise<void>;
  close: () => void;
  setModel: (model: string) => void;
  addMessage: (message: Message) => void;
  appendToLastMessage: (chunk: string) => void;
  updateMessageTools: (id: string, toolCalls: Message["toolCalls"], toolResults: Message["toolResults"]) => void;
  finalizeStream: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  activeConversation: null,
  isStreaming: false,

  load: async () => {
    const conversations = await storage.listConversations();
    set({ conversations });
  },

  create: async (model) => {
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: nanoid(),
      title: "New conversation",
      createdAt: now,
      updatedAt: now,
      messages: [],
      model,
      pinned: false,
    };
    await storage.saveConversation(conversation);
    const meta = { ...conversation } as Omit<Conversation, "messages">;
    set((s) => ({
      conversations: [meta, ...s.conversations],
      activeConversation: conversation,
    }));
    return conversation;
  },

  open: async (id) => {
    const full = await storage.loadConversation(id);
    set({ activeConversation: full });
  },

  close: () => set({ activeConversation: null }),

  setModel: (model) => {
    set((s) => {
      if (!s.activeConversation) return s;
      return {
        activeConversation: { ...s.activeConversation, model },
      };
    });
  },

  addMessage: (message) => {
    set((s) => {
      if (!s.activeConversation) return s;
      return {
        activeConversation: {
          ...s.activeConversation,
          messages: [...s.activeConversation.messages, message],
        },
        isStreaming: message.role === "assistant" && message.content === "",
      };
    });
  },

  updateMessageTools: (id, toolCalls, toolResults) => {
    set((s) => {
      if (!s.activeConversation) return s;
      return {
        activeConversation: {
          ...s.activeConversation,
          messages: s.activeConversation.messages.map((m) =>
            m.id === id ? { ...m, toolCalls, toolResults } : m
          ),
        },
      };
    });
  },

  appendToLastMessage: (chunk) => {
    set((s) => {
      if (!s.activeConversation) return s;
      const messages = [...s.activeConversation.messages];
      const last = messages[messages.length - 1];
      if (!last || last.role !== "assistant") return s;
      messages[messages.length - 1] = { ...last, content: last.content + chunk };
      return { activeConversation: { ...s.activeConversation, messages } };
    });
  },

  finalizeStream: async () => {
    set({ isStreaming: false });
    const { activeConversation, conversations } = get();
    if (!activeConversation) return;

    // Auto-title from first user message if still "New conversation"
    let title = activeConversation.title;
    if (title === "New conversation") {
      const first = activeConversation.messages.find((m) => m.role === "user");
      if (first) title = first.content.slice(0, 60).trimEnd();
    }

    const updated: Conversation = {
      ...activeConversation,
      title,
      updatedAt: new Date().toISOString(),
    };

    await storage.saveConversation(updated);

    // Sync metadata list
    const meta = { ...updated } as Omit<Conversation, "messages">;
    set({
      activeConversation: updated,
      conversations: conversations.map((c) => (c.id === updated.id ? meta : c)),
    });
  },

  remove: async (id) => {
    await storage.deleteConversation(id);
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeConversation:
        s.activeConversation?.id === id ? null : s.activeConversation,
    }));
  },
}));
