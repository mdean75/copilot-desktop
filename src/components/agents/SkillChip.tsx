import { useSkillStore } from "../../store/useSkillStore";

export function SkillChip() {
  const { activeSkill, setActive } = useSkillStore();
  const skill = activeSkill();
  if (!skill) return null;

  return (
    <div className="flex items-center gap-1 rounded-full bg-[hsl(var(--primary))] px-2.5 py-0.5 text-xs text-white">
      <span>⚡</span>
      <span className="font-medium">{skill.name}</span>
      <button
        onClick={() => setActive(null)}
        className="ml-0.5 opacity-70 hover:opacity-100"
        aria-label="Remove skill"
      >
        ×
      </button>
    </div>
  );
}
