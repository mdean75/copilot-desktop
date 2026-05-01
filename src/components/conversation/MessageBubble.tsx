import type { Message } from "../../types/conversation";

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[hsl(var(--primary))] text-white"
            : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
        }`}
      >
        {message.content || (
          <span className="animate-pulse opacity-50">●●●</span>
        )}
      </div>
    </div>
  );
}
