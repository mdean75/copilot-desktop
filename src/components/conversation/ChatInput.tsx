import { useRef, useState } from "react";
import { useChat } from "../../hooks/useChat";
import { useConversationStore } from "../../store/useConversationStore";
import { useSkillStore } from "../../store/useSkillStore";
import { SkillChip } from "../skills/SkillChip";
import { MODELS } from "../../types/settings";

export function ChatInput() {
  const [value, setValue] = useState("");
  const { sendMessage, isStreaming } = useChat();
  const { activeConversation, create } = useConversationStore();
  const { activeSkill, activeSkillId } = useSkillStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    // Auto-create a conversation if none is active
    if (!activeConversation) await create(MODELS[0].id);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-grow textarea
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const skill = activeSkill();
  const placeholder = skill?.starterPrompt
    ? skill.starterPrompt
    : "Ask anything… (Shift+Enter for new line)";

  return (
    <div className="border-t border-[hsl(var(--border))] p-3">
      {activeSkillId && (
        <div className="mb-2 flex items-center gap-2">
          <SkillChip />
        </div>
      )}
      <div className="flex items-end gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 focus-within:ring-1 focus-within:ring-[hsl(var(--primary))]">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          className="flex-1 resize-none bg-transparent text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || isStreaming}
          className="flex-shrink-0 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isStreaming ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
