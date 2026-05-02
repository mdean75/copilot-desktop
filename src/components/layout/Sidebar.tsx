import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useConversationStore } from "../../store/useConversationStore";
import { useModelStore } from "../../store/useModelStore";
import { useAgentStore } from "../../store/useAgentStore";
import { useSkillStore } from "../../store/useSkillStore";
import { useMcpStore } from "../../store/useMcpStore";
import { ConversationList } from "../conversation/ConversationList";
import { AgentList } from "../agents/AgentList";
import { AgentBuilderDrawer } from "../agents/AgentBuilderDrawer";
import { McpServerDrawer } from "../mcp/McpServerDrawer";

export function Sidebar() {
  const { user, signOut } = useAuthStore();
  const { load: loadConversations, create } = useConversationStore();
  const { selectedModel } = useModelStore();
  const { load: loadAgents, setActive: setActiveAgent } = useAgentStore();
  const { skills, activeSkillDirName, setActive: setActiveSkill, load: loadSkills } = useSkillStore();
  const { load: loadMcp, serverStates } = useMcpStore();
  const [showAgentBuilder, setShowAgentBuilder] = useState(false);
  const [showMcpDrawer, setShowMcpDrawer] = useState(false);

  useEffect(() => {
    loadConversations();
    loadAgents();
    loadSkills();
    loadMcp();
  }, []);

  const runningCount = serverStates.filter((s) => s.status === "running").length;

  return (
    <>
      <aside className="flex h-full w-60 flex-shrink-0 flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]">
        <div className="p-3">
          <button
            onClick={() => create(selectedModel)}
            className="flex w-full items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <span>+</span>
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider opacity-50">
            Recents
          </p>
          <ConversationList />

          <div className="my-2 border-t border-[hsl(var(--sidebar-border))]" />

          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider opacity-50">
            My Agents
          </p>
          <AgentList
            onNewAgent={() => setShowAgentBuilder(true)}
            onSelectAgent={() => setActiveSkill(null)}
          />

          <div className="my-2 border-t border-[hsl(var(--sidebar-border))]" />

          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider opacity-50">
            Skills
          </p>
          {skills.length === 0 ? (
            <p className="px-2 py-2 text-xs opacity-40">
              Add skills to ~/.copilot/skills/
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {skills.map((skill) => {
                const isActive = skill.dirName === activeSkillDirName;
                return (
                  <button
                    key={skill.dirName}
                    onClick={() => {
                      setActiveSkill(isActive ? null : skill.dirName);
                      if (!isActive) setActiveAgent(null);
                    }}
                    title={skill.description || undefined}
                    className={`flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left transition-colors ${
                      isActive
                        ? "bg-[hsl(var(--primary))] text-white"
                        : "text-[hsl(var(--sidebar-foreground))] hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs">⚡</span>
                    <p className="truncate text-xs font-medium">{skill.name}</p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="my-2 border-t border-[hsl(var(--sidebar-border))]" />

          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider opacity-50">
            Apps
          </p>
          {serverStates.length === 0 ? (
            <p className="px-2 py-2 text-xs opacity-40">No apps connected</p>
          ) : (
            <div className="py-1">
              {serverStates.map((ss) => (
                <div key={ss.config.id} className="flex items-center gap-2 px-2 py-1">
                  <span
                    className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                      ss.status === "running"
                        ? "bg-green-500"
                        : ss.status === "error"
                        ? "bg-red-500"
                        : ss.status === "starting"
                        ? "bg-yellow-400 animate-pulse"
                        : "bg-gray-400"
                    }`}
                  />
                  <span className="truncate text-xs">{ss.config.displayName}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowMcpDrawer(true)}
            className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs opacity-60 hover:opacity-100"
          >
            + Add App
          </button>
        </div>

        <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
          <div className="flex items-center gap-2">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt={user.name} className="h-6 w-6 rounded-full" />
            )}
            <span className="flex-1 truncate text-xs">{user?.name}</span>
            {runningCount > 0 && (
              <span className="text-xs opacity-50">{runningCount} app{runningCount > 1 ? "s" : ""}</span>
            )}
            <button onClick={signOut} className="text-xs opacity-50 hover:opacity-100" title="Sign out">
              ↩
            </button>
          </div>
        </div>
      </aside>

      {showAgentBuilder && (
        <AgentBuilderDrawer onClose={() => setShowAgentBuilder(false)} />
      )}
      {showMcpDrawer && (
        <McpServerDrawer onClose={() => setShowMcpDrawer(false)} />
      )}
    </>
  );
}
