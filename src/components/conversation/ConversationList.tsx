import { useConversationStore } from "../../store/useConversationStore";
import { ConversationItem } from "./ConversationItem";

export function ConversationList() {
  const { conversations, activeConversation, open, remove } = useConversationStore();

  if (conversations.length === 0) {
    return (
      <p className="px-2 py-3 text-xs text-[hsl(var(--sidebar-foreground))] opacity-40">
        No conversations yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {conversations.map((c) => (
        <ConversationItem
          key={c.id}
          conversation={c}
          isActive={activeConversation?.id === c.id}
          onClick={() => open(c.id)}
          onDelete={() => remove(c.id)}
        />
      ))}
    </div>
  );
}
