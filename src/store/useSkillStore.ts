import { create } from "zustand";
import type { FsSkill } from "../types/skill";
import { listFsSkills } from "../lib/storage";

interface SkillStore {
  skills: FsSkill[];
  activeSkillDirName: string | null;
  load: () => Promise<void>;
  activeSkill: () => FsSkill | undefined;
  setActive: (dirName: string | null) => void;
}

export const useSkillStore = create<SkillStore>((set, get) => ({
  skills: [],
  activeSkillDirName: null,

  load: async () => {
    try {
      const skills = await listFsSkills();
      set({ skills });
    } catch {
      set({ skills: [] });
    }
  },

  activeSkill: () =>
    get().skills.find((s) => s.dirName === get().activeSkillDirName),

  setActive: (dirName) => set({ activeSkillDirName: dirName }),
}));
