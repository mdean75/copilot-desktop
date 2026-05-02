import { useState } from "react";
import { useAgentStore } from "../../store/useAgentStore";
import { useMcpStore } from "../../store/useMcpStore";
import { BUILTIN_TOOL_LABELS } from "../../lib/toolLabels";
import { McpServerDrawer } from "../mcp/McpServerDrawer";
import type { McpServerStatus } from "../../types/mcp";

function StatusDot({ status }: { status: McpServerStatus }) {
  const colors: Record<McpServerStatus, string> = {
    stopped: "bg-gray-400",
    starting: "bg-yellow-400 animate-pulse",
    running: "bg-green-500",
    error: "bg-red-500",
  };
  return <span className={`h-2 w-2 flex-shrink-0 rounded-full ${colors[status]}`} />;
}

export function ContextPanel() {
  const { activeAgent } = useAgentStore();
  const { serverStates, startServer, stopServer, removeServer } = useMcpStore();
  const [showMcpDrawer, setShowMcpDrawer] = useState(false);
  const agent = activeAgent();

  return (
    <>
      <aside className="flex h-full w-72 flex-shrink-0 flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        {/* Active skill */}
        <div className="border-b border-[hsl(var(--border))] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Active Agent
          </p>
          {agent ? (
            <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2">
              <div className="flex items-center gap-1.5">
                <span>{agent.icon}</span>
                <span className="text-sm font-medium">{agent.name}</span>
              </div>
              {agent.description && (
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {agent.description}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">None</p>
          )}
        </div>

        {/* Tools in use */}
        <div className="border-b border-[hsl(var(--border))] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Tools in Use
          </p>
          {agent?.enabledBuiltinTools.length ? (
            <div className="flex flex-col gap-1">
              {agent.enabledBuiltinTools.map((toolId) => (
                <div key={toolId} className="flex items-center gap-1.5 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>{BUILTIN_TOOL_LABELS[toolId]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No tools active</p>
          )}
        </div>

        {/* Connected apps */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Connected Apps
          </p>

          {serverStates.length === 0 ? (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No apps connected</p>
          ) : (
            <div className="flex flex-col gap-1">
              {serverStates.map((ss) => (
                <div
                  key={ss.config.id}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[hsl(var(--background))]"
                >
                  <StatusDot status={ss.status} />
                  <span className="flex-1 truncate text-xs font-medium">
                    {ss.config.displayName}
                  </span>
                  {ss.status === "running" && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {ss.availableTools.length} tools
                    </span>
                  )}
                  {ss.status === "error" && (
                    <button
                      onClick={() => startServer(ss.config.id)}
                      className="hidden text-xs text-[hsl(var(--primary))] group-hover:block"
                      title={ss.errorMessage}
                    >
                      Retry
                    </button>
                  )}
                  {ss.status === "running" && (
                    <button
                      onClick={() => stopServer(ss.config.id)}
                      className="hidden text-xs text-[hsl(var(--muted-foreground))] group-hover:block hover:text-[hsl(var(--foreground))]"
                    >
                      Stop
                    </button>
                  )}
                  {ss.status === "stopped" && (
                    <button
                      onClick={() => startServer(ss.config.id)}
                      className="hidden text-xs text-[hsl(var(--primary))] group-hover:block"
                    >
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => removeServer(ss.config.id)}
                    className="hidden text-xs text-[hsl(var(--muted-foreground))] group-hover:block hover:text-red-500"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowMcpDrawer(true)}
            className="mt-3 text-xs text-[hsl(var(--primary))] hover:underline"
          >
            + Connect an App
          </button>
        </div>
      </aside>

      {showMcpDrawer && (
        <McpServerDrawer onClose={() => setShowMcpDrawer(false)} />
      )}
    </>
  );
}
