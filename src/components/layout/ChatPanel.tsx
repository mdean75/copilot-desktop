import { useConversationStore } from "../../store/useConversationStore";
import { ModelPicker } from "../model/ModelPicker";
import { MessageList } from "../conversation/MessageList";
import { ChatInput } from "../conversation/ChatInput";
import { MODELS } from "../../types/settings";

export function ChatPanel() {
  const { activeConversation, create } = useConversationStore();

  const handleModelChange = (modelId: string) => {
    // Model changes take effect on the next new conversation
    if (!activeConversation) create(modelId);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center border-b border-[hsl(var(--border))] px-4 py-2">
        <ModelPicker
          value={activeConversation?.model ?? MODELS[0].id}
          onChange={handleModelChange}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <MessageList />
      </div>
      <ChatInput />
    </div>
  );
}
