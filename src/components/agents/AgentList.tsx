import { useAgentStore } from "../../store/useAgentStore";

interface Props {
  onNewAgent: () => void;
  onSelectAgent?: () => void;
}

export function AgentList({ onNewAgent, onSelectAgent }: Props) {
  const { allAgents, activeAgentId, setActive, remove } = useAgentStore();
  const agents = allAgents();

  return (
    <div className="flex flex-col gap-0.5">
      {agents.map((agent) => {
        const isActive = agent.id === activeAgentId;
        return (
          <div key={agent.id} className="group flex items-center gap-1">
            <button
              onClick={() => {
                setActive(isActive ? null : agent.id);
                if (!isActive) onSelectAgent?.();
              }}
              className={`flex flex-1 items-center gap-1.5 rounded px-2 py-1.5 text-left transition-colors ${
                isActive
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "text-[hsl(var(--sidebar-foreground))] hover:bg-white/10"
              }`}
            >
              <span>{agent.icon}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{agent.name}</p>
              </div>
            </button>
            {!agent.isBuiltin && (
              <button
                onClick={() => remove(agent.id)}
                className="hidden px-1 text-xs opacity-40 hover:opacity-100 group-hover:block"
                title="Delete agent"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onNewAgent}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs opacity-60 hover:opacity-100 text-[hsl(var(--sidebar-foreground))]"
      >
        + New Agent
      </button>
    </div>
  );
}
