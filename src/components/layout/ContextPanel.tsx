import { useSkillStore } from "../../store/useSkillStore";
import { BUILTIN_TOOL_LABELS } from "../../lib/toolLabels";

export function ContextPanel() {
  const { activeSkill } = useSkillStore();
  const skill = activeSkill();

  return (
    <aside className="flex h-full w-72 flex-shrink-0 flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
      {/* Active skill */}
      <div className="border-b border-[hsl(var(--border))] p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Active Skill
        </p>
        {skill ? (
          <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2">
            <div className="flex items-center gap-1.5">
              <span>{skill.icon}</span>
              <span className="text-sm font-medium">{skill.name}</span>
            </div>
            {skill.description && (
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {skill.description}
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
        {skill?.enabledBuiltinTools.length ? (
          <div className="flex flex-col gap-1">
            {skill.enabledBuiltinTools.map((toolId) => (
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
      <div className="flex-1 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Connected Apps
        </p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">No apps connected</p>
        <button className="mt-2 text-xs text-[hsl(var(--primary))] hover:underline">
          + Connect an App
        </button>
      </div>
    </aside>
  );
}
