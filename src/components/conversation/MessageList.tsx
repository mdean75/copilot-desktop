import { useEffect, useRef } from "react";
import { useConversationStore } from "../../store/useConversationStore";
import { MessageBubble } from "./MessageBubble";

export function MessageList() {
  const { activeConversation } = useConversationStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const msgs = activeConversation?.messages ?? [];
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, msgs[msgs.length - 1]?.content]);

  if (!activeConversation || activeConversation.messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-[hsl(var(--muted-foreground))]">
          <p className="text-lg font-medium">How can I help?</p>
          <p className="mt-1 text-sm">Ask anything, or pick a skill from the sidebar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {activeConversation.messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
