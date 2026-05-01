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

  // Prompt history: list of sent messages, index -1 means "current draft"
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const draftValue = useRef("");

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    if (!activeConversation) await create(MODELS[0].id);

    // Push to front of history, deduplicate adjacent
    if (history.current[0] !== trimmed) {
      history.current.unshift(trimmed);
    }
    historyIndex.current = -1;
    draftValue.current = "";

    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    // History navigation — only when caret is at the first/last line
    const el = textareaRef.current;
    if (!el) return;

    if (e.key === "ArrowUp" && history.current.length > 0) {
      // Only navigate if we're on the first line (or field is empty)
      const atTop = el.selectionStart === 0 || !value.includes("\n");
      if (!atTop) return;
      e.preventDefault();

      if (historyIndex.current === -1) {
        draftValue.current = value; // save current draft
      }
      const nextIndex = Math.min(historyIndex.current + 1, history.current.length - 1);
      historyIndex.current = nextIndex;
      const recalled = history.current[nextIndex];
      setValue(recalled);
      // Move caret to end after React re-renders
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = recalled.length;
          textareaRef.current.selectionEnd = recalled.length;
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
      });
      return;
    }

    if (e.key === "ArrowDown" && historyIndex.current >= 0) {
      const atBottom =
        el.selectionStart === el.value.length || !value.includes("\n");
      if (!atBottom) return;
      e.preventDefault();

      const nextIndex = historyIndex.current - 1;
      historyIndex.current = nextIndex;
      const recalled = nextIndex === -1 ? draftValue.current : history.current[nextIndex];
      setValue(recalled);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = recalled.length;
          textareaRef.current.selectionEnd = recalled.length;
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
      });
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    // Reset history navigation when user types
    if (historyIndex.current !== -1) {
      historyIndex.current = -1;
    }
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
