import { useConversationStore } from "../../store/useConversationStore";
import { useModelStore } from "../../store/useModelStore";
import { ModelPicker } from "../model/ModelPicker";
import { MessageList } from "../conversation/MessageList";
import { ChatInput } from "../conversation/ChatInput";

export function ChatPanel() {
  const { activeConversation, create, setModel } = useConversationStore();
  const { selectedModel, setSelectedModel } = useModelStore();

  const currentModel = activeConversation?.model ?? selectedModel;

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    if (activeConversation) {
      setModel(modelId);
    } else {
      create(modelId);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center border-b border-[hsl(var(--border))] px-4 py-2">
        <ModelPicker
          value={currentModel}
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
