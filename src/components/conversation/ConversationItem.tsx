import type { Conversation } from "../../types/conversation";

interface Props {
  conversation: Omit<Conversation, "messages">;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ConversationItem({ conversation, isActive, onClick, onDelete }: Props) {
  const date = new Date(conversation.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`w-full rounded px-2 py-1.5 pr-7 text-left transition-colors ${
          isActive
            ? "bg-[hsl(var(--primary))] text-white"
            : "text-[hsl(var(--sidebar-foreground))] hover:bg-white/10"
        }`}
      >
        <p className="truncate text-sm">{conversation.title}</p>
        <p className={`text-xs ${isActive ? "text-white/70" : "opacity-50"}`}>{date}</p>
      </button>
      <button
        onClick={handleDelete}
        title="Delete conversation"
        className={`absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
          isActive ? "text-white/70 hover:text-white" : "text-[hsl(var(--sidebar-foreground))] opacity-0 hover:opacity-100"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3h8M5 3V2h2v1M3 3l.5 7h5l.5-7" />
        </svg>
      </button>
    </div>
  );
}
