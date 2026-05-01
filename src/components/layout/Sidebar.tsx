import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useConversationStore } from "../../store/useConversationStore";
import { useSkillStore } from "../../store/useSkillStore";
import { ConversationList } from "../conversation/ConversationList";
import { SkillList } from "../skills/SkillList";
import { SkillBuilderDrawer } from "../skills/SkillBuilderDrawer";
import { MODELS } from "../../types/settings";

export function Sidebar() {
  const { user, signOut } = useAuthStore();
  const { load: loadConversations, create } = useConversationStore();
  const { load: loadSkills } = useSkillStore();
  const [showSkillBuilder, setShowSkillBuilder] = useState(false);

  useEffect(() => {
    loadConversations();
    loadSkills();
  }, []);

  return (
    <>
      <aside className="flex h-full w-60 flex-shrink-0 flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]">
        <div className="p-3">
          <button
            onClick={() => create(MODELS[0].id)}
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
            My Skills
          </p>
          <SkillList onNewSkill={() => setShowSkillBuilder(true)} />

          <div className="my-2 border-t border-[hsl(var(--sidebar-border))]" />

          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider opacity-50">
            Apps
          </p>
          <p className="px-2 py-2 text-xs opacity-40">No apps connected</p>
          <button className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs opacity-60 hover:opacity-100">
            + Add App
          </button>
        </div>

        <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
          <div className="flex items-center gap-2">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt={user.name} className="h-6 w-6 rounded-full" />
            )}
            <span className="flex-1 truncate text-xs">{user?.name}</span>
            <button onClick={signOut} className="text-xs opacity-50 hover:opacity-100" title="Sign out">
              ↩
            </button>
          </div>
        </div>
      </aside>

      {showSkillBuilder && (
        <SkillBuilderDrawer onClose={() => setShowSkillBuilder(false)} />
      )}
    </>
  );
}
