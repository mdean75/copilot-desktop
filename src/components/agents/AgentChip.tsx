import { useAgentStore } from "../../store/useAgentStore";

export function AgentChip() {
  const { activeAgent, setActive } = useAgentStore();
  const agent = activeAgent();
  if (!agent) return null;

  return (
    <div className="flex items-center gap-1 rounded-full bg-[hsl(var(--primary))] px-2.5 py-0.5 text-xs text-white">
      <span>{agent.icon}</span>
      <span className="font-medium">{agent.name}</span>
      <button
        onClick={() => setActive(null)}
        className="ml-0.5 opacity-70 hover:opacity-100"
        aria-label="Remove agent"
      >
        ×
      </button>
    </div>
  );
}
