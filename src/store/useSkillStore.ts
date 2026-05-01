import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Skill, BuiltinToolId } from "../types/skill";
import { BUILTIN_SKILLS } from "../lib/builtinSkills";
import * as storage from "../lib/storage";

interface SkillStore {
  userSkills: Skill[];
  activeSkillId: string | null;

  allSkills: () => Skill[];
  activeSkill: () => Skill | undefined;
  load: () => Promise<void>;
  create: (draft: {
    name: string;
    description: string;
    systemPrompt: string;
    icon: string;
    enabledBuiltinTools: BuiltinToolId[];
    enabledMcpServerIds: string[];
    starterPrompt?: string;
  }) => Promise<void>;
  update: (skill: Skill) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setActive: (id: string | null) => void;
}

export const useSkillStore = create<SkillStore>((set, get) => ({
  userSkills: [],
  activeSkillId: null,

  allSkills: () => [...BUILTIN_SKILLS, ...get().userSkills],

  activeSkill: () => get().allSkills().find((s) => s.id === get().activeSkillId),

  load: async () => {
    const userSkills = await storage.listSkills();
    set({ userSkills });
  },

  create: async (draft) => {
    const now = new Date().toISOString();
    const skill: Skill = {
      ...draft,
      id: nanoid(),
      isBuiltin: false,
      createdAt: now,
      updatedAt: now,
    };
    await storage.saveSkill(skill);
    set((s) => ({ userSkills: [...s.userSkills, skill] }));
  },

  update: async (skill) => {
    const updated = { ...skill, updatedAt: new Date().toISOString() };
    await storage.saveSkill(updated);
    set((s) => ({
      userSkills: s.userSkills.map((sk) => (sk.id === updated.id ? updated : sk)),
    }));
  },

  remove: async (id) => {
    await storage.deleteSkill(id);
    set((s) => ({
      userSkills: s.userSkills.filter((sk) => sk.id !== id),
      activeSkillId: s.activeSkillId === id ? null : s.activeSkillId,
    }));
  },

  setActive: (id) => set({ activeSkillId: id }),
}));
