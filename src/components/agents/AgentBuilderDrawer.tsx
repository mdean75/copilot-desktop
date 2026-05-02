import { useState } from "react";
import { useAgentStore } from "../../store/useAgentStore";
import { useMcpStore } from "../../store/useMcpStore";
import { BUILTIN_TOOL_LABELS } from "../../lib/toolLabels";
import type { BuiltinToolId } from "../../types/agent";

const ICONS = ["🤖", "🔍", "🐙", "📋", "📊", "✏️", "🗂", "💡", "🚀", "📝", "🔧", "⚡"];

interface Props {
  onClose: () => void;
}

export function AgentBuilderDrawer({ onClose }: Props) {
  const { create } = useAgentStore();
  const { serverStates } = useMcpStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [starterPrompt, setStarterPrompt] = useState("");
  const [icon, setIcon] = useState("🤖");
  const [enabledTools, setEnabledTools] = useState<BuiltinToolId[]>([]);
  const [enabledMcpServerIds, setEnabledMcpServerIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTool = (toolId: BuiltinToolId) => {
    setEnabledTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const toggleMcpServer = (id: string) => {
    setEnabledMcpServerIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    setIsSaving(true);
    try {
      await create({
        name: name.trim(),
        description: description.trim(),
        systemPrompt: systemPrompt.trim(),
        icon,
        enabledBuiltinTools: enabledTools,
        enabledMcpServerIds,
        starterPrompt: starterPrompt.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />

      <div className="flex h-full w-[480px] flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-xl">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
          <button onClick={onClose} className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            ← Back
          </button>
          <h2 className="text-sm font-semibold">Create New Agent</h2>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !systemPrompt.trim() || isSaving}
            className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            {isSaving ? "Saving…" : "Save Agent"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--foreground))]">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`rounded p-1.5 text-lg transition-colors ${
                    icon === emoji
                      ? "bg-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]"
                      : "hover:bg-[hsl(var(--muted))]"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--foreground))]">
              Agent Name <span className="text-[hsl(var(--destructive))]">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PM Assistant"
              className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--foreground))]">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Helps with PRDs and roadmaps"
              className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--foreground))]">
              System Prompt <span className="text-[hsl(var(--destructive))]">*</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Describe how the assistant should behave…"
              rows={6}
              className="w-full resize-none rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              This shapes how the assistant responds in every message.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--foreground))]">
              Built-in Tools
            </label>
            <div className="rounded-md border border-[hsl(var(--border))] divide-y divide-[hsl(var(--border))]">
              {(Object.keys(BUILTIN_TOOL_LABELS) as BuiltinToolId[]).map((toolId) => (
                <label key={toolId} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-[hsl(var(--muted))]">
                  <input
                    type="checkbox"
                    checked={enabledTools.includes(toolId)}
                    onChange={() => toggleTool(toolId)}
                    className="accent-[hsl(var(--primary))]"
                  />
                  <span className="text-sm">{BUILTIN_TOOL_LABELS[toolId]}</span>
                </label>
              ))}
            </div>
          </div>

          {serverStates.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--foreground))]">
                Connected Apps
              </label>
              <div className="rounded-md border border-[hsl(var(--border))] divide-y divide-[hsl(var(--border))]">
                {serverStates.map((ss) => (
                  <label
                    key={ss.config.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-[hsl(var(--muted))]"
                  >
                    <input
                      type="checkbox"
                      checked={enabledMcpServerIds.includes(ss.config.id)}
                      onChange={() => toggleMcpServer(ss.config.id)}
                      className="accent-[hsl(var(--primary))]"
                    />
                    <span className="flex-1 text-sm">{ss.config.displayName}</span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        ss.status === "running" ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    {ss.status === "running" && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {ss.availableTools.length} tools
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                Apps must be running to use their tools.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--foreground))]">
              Starter Prompt <span className="text-[hsl(var(--muted-foreground))]">(optional)</span>
            </label>
            <input
              value={starterPrompt}
              onChange={(e) => setStarterPrompt(e.target.value)}
              placeholder="e.g. Help me write a PRD for…"
              className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Pre-fills the chat input when this agent is activated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
