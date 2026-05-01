import { useSkillStore } from "../../store/useSkillStore";

interface Props {
  onNewSkill: () => void;
}

export function SkillList({ onNewSkill }: Props) {
  const { allSkills, activeSkillId, setActive, remove } = useSkillStore();
  const skills = allSkills();

  return (
    <div className="flex flex-col gap-0.5">
      {skills.map((skill) => {
        const isActive = skill.id === activeSkillId;
        return (
          <div key={skill.id} className="group flex items-center gap-1">
            <button
              onClick={() => setActive(isActive ? null : skill.id)}
              className={`flex flex-1 items-center gap-1.5 rounded px-2 py-1.5 text-left transition-colors ${
                isActive
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "text-[hsl(var(--sidebar-foreground))] hover:bg-white/10"
              }`}
            >
              <span>{skill.icon}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{skill.name}</p>
              </div>
            </button>
            {!skill.isBuiltin && (
              <button
                onClick={() => remove(skill.id)}
                className="hidden px-1 text-xs opacity-40 hover:opacity-100 group-hover:block"
                title="Delete skill"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onNewSkill}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs opacity-60 hover:opacity-100 text-[hsl(var(--sidebar-foreground))]"
      >
        + New Skill
      </button>
    </div>
  );
}
