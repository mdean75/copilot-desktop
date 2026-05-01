import type { Conversation } from "../../types/conversation";

interface Props {
  conversation: Omit<Conversation, "messages">;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: Props) {
  const date = new Date(conversation.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className={`w-full rounded px-2 py-1.5 text-left transition-colors ${
        isActive
          ? "bg-[hsl(var(--primary))] text-white"
          : "text-[hsl(var(--sidebar-foreground))] hover:bg-white/10"
      }`}
    >
      <p className="truncate text-sm">{conversation.title}</p>
      <p className={`text-xs ${isActive ? "text-white/70" : "opacity-50"}`}>{date}</p>
    </button>
  );
}
