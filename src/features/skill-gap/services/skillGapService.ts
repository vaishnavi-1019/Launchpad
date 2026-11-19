import { mockJobs } from "@/features/job-discovery/services/mockJobs";
import type { JobListing } from "@/features/job-discovery/types";
import {
  SKILL_CATEGORIES,
  type SkillCategory,
  type SkillGapPlan,
  type SkillLearningStatus,
  type SkillPriority,
  type SkillProficiency,
  type TrackedSkill,
  type TrackedSkillDraft,
} from "../types";

const STORAGE_KEY = "launchpad.skill-gap.v1";
const PROFICIENCIES: SkillProficiency[] = [
  "beginner",
  "learning",
  "intermediate",
  "advanced",
];
const LEARNING_STATUSES: SkillLearningStatus[] = [
  "have",
  "learning",
  "to-learn",
  "completed",
];
const PRIORITIES: SkillPriority[] = ["high", "medium", "low"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function includesValue<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.some((item) => item === value);
}

function createId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function inferCategory(name: string): SkillCategory {
  const normalized = name.toLocaleLowerCase();
  if (["react", "typescript", "javascript", "html", "css", "accessibility"].some((term) => normalized.includes(term))) {
    return "Frontend";
  }
  if (["sql", "database", "postgres", "mysql", "mongo"].some((term) => normalized.includes(term))) {
    return "Database";
  }
  if (["node", "api", "python", "java", "backend", "rest"].some((term) => normalized.includes(term))) {
    return "Backend";
  }
  if (["communication", "collaboration", "leadership", "research", "stakeholder", "teamwork"].some((term) => normalized.includes(term))) {
    return "Soft Skills";
  }
  return "Tools";
}

function mockSkill(
  name: string,
  category: SkillCategory,
  learningStatus: SkillLearningStatus,
  proficiency: SkillProficiency,
  progress: number,
  priority: SkillPriority,
  resources: string[] = [],
): TrackedSkill {
  const now = new Date().toISOString();
  return {
    id: `skill-${name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    category,
    learningStatus,
    proficiency,
    progress,
    priority,
    manualRequired: true,
    sourceJobIds: [],
    resources,
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialSkillGapPlan(): SkillGapPlan {
  const now = new Date().toISOString();
  return {
    id: "skill-plan-frontend-engineer",
    targetRole: "Frontend Engineer",
    selectedJobIds: [],
    skills: [
      mockSkill("HTML & CSS", "Frontend", "have", "advanced", 100, "high", ["MDN: HTML & CSS guides"]),
      mockSkill("JavaScript", "Frontend", "have", "intermediate", 100, "high", ["javascript.info"]),
      mockSkill("React", "Frontend", "learning", "learning", 62, "high", ["React documentation", "Frontend Mentor"]),
      mockSkill("TypeScript", "Frontend", "learning", "learning", 35, "high", ["TypeScript Handbook"]),
      mockSkill("Accessibility", "Frontend", "to-learn", "beginner", 0, "medium", ["WebAIM accessibility articles"]),
      mockSkill("REST APIs", "Backend", "to-learn", "beginner", 0, "medium"),
      mockSkill("Git & GitHub", "Tools", "have", "intermediate", 100, "medium"),
      mockSkill("Communication", "Soft Skills", "have", "intermediate", 100, "medium"),
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function migrateSkill(value: unknown): TrackedSkill | null {
  if (!isRecord(value)) return null;
  const {
    id,
    name,
    category,
    proficiency,
    learningStatus,
    progress,
    priority,
    manualRequired,
    sourceJobIds,
    resources,
    createdAt,
    updatedAt,
  } = value;
  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    !includesValue(SKILL_CATEGORIES, category) ||
    !includesValue(PROFICIENCIES, proficiency) ||
    !includesValue(LEARNING_STATUSES, learningStatus) ||
    typeof progress !== "number" ||
    !Number.isFinite(progress) ||
    progress < 0 ||
    progress > 100 ||
    !includesValue(PRIORITIES, priority) ||
    typeof manualRequired !== "boolean" ||
    !Array.isArray(sourceJobIds) ||
    sourceJobIds.some((jobId) => typeof jobId !== "string") ||
    !Array.isArray(resources) ||
    resources.some((resource) => typeof resource !== "string") ||
    typeof createdAt !== "string" ||
    typeof updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id,
    name,
    category,
    proficiency,
    learningStatus,
    progress: Math.round(progress),
    priority,
    manualRequired,
    sourceJobIds,
    resources,
    createdAt,
    updatedAt,
  };
}

function migratePlan(value: unknown): SkillGapPlan | null {
  if (!isRecord(value) || !Array.isArray(value.skills) || !Array.isArray(value.selectedJobIds)) {
    return null;
  }
  const skills = value.skills.map(migrateSkill);
  if (
    skills.some((skill) => skill === null) ||
    value.selectedJobIds.some((jobId) => typeof jobId !== "string") ||
    typeof value.id !== "string" ||
    typeof value.targetRole !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    targetRole: value.targetRole,
    selectedJobIds: [...new Set(value.selectedJobIds)],
    skills: skills.filter((skill): skill is TrackedSkill => skill !== null),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function loadSkillPlan(): SkillGapPlan {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) {
    const plan = createInitialSkillGapPlan();
    persistSkillPlan(plan);
    return plan;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored) as unknown;
  } catch {
    throw new Error("Saved skill roadmap is invalid JSON. Clear Launchpad site storage to reset it.");
  }
  const plan = migratePlan(parsed);
  if (!plan) {
    throw new Error("Saved skill roadmap contains invalid data. Clear Launchpad site storage to reset it.");
  }
  return plan;
}

export function resetSkillPlan() {
  const plan = createInitialSkillGapPlan();
  persistSkillPlan(plan);
  return plan;
}

export function persistSkillPlan(plan: SkillGapPlan) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown storage error";
    throw new Error(`Could not save your skill roadmap to this browser: ${reason}`);
  }
}

export function updateTargetRole(plan: SkillGapPlan, targetRole: string): SkillGapPlan {
  return { ...plan, targetRole: targetRole.trim(), updatedAt: new Date().toISOString() };
}

export function addTrackedSkill(
  plan: SkillGapPlan,
  draft: TrackedSkillDraft,
): SkillGapPlan {
  if (plan.skills.some((skill) => skill.name.trim().toLocaleLowerCase() === draft.name.trim().toLocaleLowerCase())) {
    throw new Error("That skill is already in your roadmap.");
  }
  const now = new Date().toISOString();
  const skill: TrackedSkill = {
    ...draft,
    id: createId(),
    name: draft.name.trim(),
    progress: draft.learningStatus === "completed" || draft.learningStatus === "have"
      ? 100
      : Math.round(draft.progress),
    sourceJobIds: [],
    resources: draft.resources.map((resource) => resource.trim()).filter(Boolean),
    createdAt: now,
    updatedAt: now,
  };
  return { ...plan, skills: [skill, ...plan.skills], updatedAt: now };
}

export function updateTrackedSkill(
  plan: SkillGapPlan,
  id: string,
  changes: Partial<TrackedSkillDraft>,
): SkillGapPlan {
  const existing = plan.skills.find((skill) => skill.id === id);
  if (!existing) throw new Error("This skill no longer exists in your roadmap.");
  const nextName = changes.name?.trim();
  if (
    nextName &&
    plan.skills.some(
      (skill) =>
        skill.id !== id &&
        skill.name.toLocaleLowerCase() === nextName.toLocaleLowerCase(),
    )
  ) {
    throw new Error("That skill is already in your roadmap.");
  }
  const updatedAt = new Date().toISOString();
  return {
    ...plan,
    updatedAt,
    skills: plan.skills.map((skill) => {
      if (skill.id !== id) return skill;
      const learningStatus = changes.learningStatus ?? skill.learningStatus;
      const progress =
        learningStatus === "completed" || learningStatus === "have"
          ? 100
          : changes.progress === undefined
            ? skill.progress
            : Math.min(100, Math.max(0, Math.round(changes.progress)));
      return {
        ...skill,
        ...changes,
        name: nextName ?? skill.name,
        learningStatus,
        progress,
        sourceJobIds: [...skill.sourceJobIds],
        resources: changes.resources
          ? changes.resources.map((resource) => resource.trim()).filter(Boolean)
          : [...skill.resources],
        updatedAt,
      };
    }),
  };
}

export function deleteTrackedSkill(plan: SkillGapPlan, id: string): SkillGapPlan {
  if (!plan.skills.some((skill) => skill.id === id)) {
    throw new Error("This skill no longer exists in your roadmap.");
  }
  return {
    ...plan,
    skills: plan.skills.filter((skill) => skill.id !== id),
    updatedAt: new Date().toISOString(),
  };
}

export function compareSavedJobs(
  plan: SkillGapPlan,
  selectedJobIds: string[],
  savedJobs: JobListing[],
): SkillGapPlan {
  const selectedIds = [...new Set(selectedJobIds)];
  const selectedJobs = savedJobs.filter((job) => selectedIds.includes(job.id));
  const skills = plan.skills.map((skill) => {
    const sourceJobIds = selectedJobs
      .filter((job) => job.skills.some((name) => name.toLocaleLowerCase() === skill.name.toLocaleLowerCase()))
      .map((job) => job.id);
    return { ...skill, sourceJobIds };
  });

  for (const job of selectedJobs) {
    for (const name of job.skills) {
      const existing = skills.find(
        (skill) => skill.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      );
      if (existing) {
        if (!existing.sourceJobIds.includes(job.id)) existing.sourceJobIds.push(job.id);
        continue;
      }
      const now = new Date().toISOString();
      skills.push({
        id: createId(),
        name,
        category: inferCategory(name),
        proficiency: "beginner",
        learningStatus: "to-learn",
        progress: 0,
        priority: "medium",
        manualRequired: false,
        sourceJobIds: [job.id],
        resources: [],
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return {
    ...plan,
    selectedJobIds: selectedIds,
    skills,
    updatedAt: new Date().toISOString(),
  };
}

export function getSavedListings(savedJobIds: string[]) {
  return mockJobs.filter((job) => savedJobIds.includes(job.id));
}
