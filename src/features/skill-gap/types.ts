export const SKILL_CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "Tools",
  "Soft Skills",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
export type SkillProficiency =
  | "beginner"
  | "learning"
  | "intermediate"
  | "advanced";
export type SkillLearningStatus = "have" | "learning" | "to-learn" | "completed";
export type SkillPriority = "high" | "medium" | "low";

export interface TrackedSkill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: SkillProficiency;
  learningStatus: SkillLearningStatus;
  progress: number;
  priority: SkillPriority;
  manualRequired: boolean;
  sourceJobIds: string[];
  resources: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillGapPlan {
  id: string;
  targetRole: string;
  selectedJobIds: string[];
  skills: TrackedSkill[];
  createdAt: string;
  updatedAt: string;
}

export type TrackedSkillDraft = Omit<
  TrackedSkill,
  "id" | "createdAt" | "updatedAt" | "sourceJobIds"
>;
