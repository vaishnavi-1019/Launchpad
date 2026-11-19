import type { JobApplication } from "@/features/applications/types";
import type {
  InterviewChecklistItem,
  InterviewOutcome,
  InterviewPreparation,
  InterviewPreparationDraft,
  InterviewReminder,
  StarStory,
} from "../types";

const STORAGE_KEY = "launchpad.interview-preparation.v1";
const OUTCOMES: InterviewOutcome[] = [
  "upcoming",
  "advanced",
  "offer",
  "rejected",
  "withdrew",
];
const REMINDERS: InterviewReminder[] = ["none", "15", "30", "60", "1440"];

const DEFAULT_CHECKLIST: InterviewChecklistItem[] = [
  { id: "research", label: "Research the company and team", completed: false },
  { id: "role", label: "Review the role and its requirements", completed: false },
  { id: "stories", label: "Prepare examples from your experience", completed: false },
  { id: "questions", label: "Write questions for the interviewer", completed: false },
  { id: "setup", label: "Check interview link, setup, and timing", completed: false },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReminder(value: unknown): value is InterviewReminder {
  return typeof value === "string" && REMINDERS.some((reminder) => reminder === value);
}

function isOutcome(value: unknown): value is InterviewOutcome {
  return typeof value === "string" && OUTCOMES.some((outcome) => outcome === value);
}

function migrateChecklist(value: unknown): InterviewChecklistItem[] | null {
  if (!Array.isArray(value)) return null;
  const items: InterviewChecklistItem[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.label !== "string" ||
      typeof item.completed !== "boolean"
    ) {
      return null;
    }
    items.push({ id: item.id, label: item.label, completed: item.completed });
  }
  return items;
}

function migrateStories(value: unknown): StarStory[] | null {
  if (!Array.isArray(value)) return null;
  const stories: StarStory[] = [];
  for (const story of value) {
    if (
      !isRecord(story) ||
      typeof story.id !== "string" ||
      typeof story.title !== "string" ||
      typeof story.situation !== "string" ||
      typeof story.task !== "string" ||
      typeof story.action !== "string" ||
      typeof story.result !== "string"
    ) {
      return null;
    }
    stories.push({
      id: story.id,
      title: story.title,
      situation: story.situation,
      task: story.task,
      action: story.action,
      result: story.result,
    });
  }
  return stories;
}

function migrateStringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;
}

function migratePreparation(value: unknown): InterviewPreparation | null {
  if (!isRecord(value)) return null;
  const checklist = migrateChecklist(value.checklist);
  const starStories = migrateStories(value.starStories);
  const interviewerQuestions = migrateStringList(value.interviewerQuestions);
  const technicalQuestions = migrateStringList(value.technicalQuestions);
  const behavioralQuestions = migrateStringList(value.behavioralQuestions);
  if (
    typeof value.id !== "string" ||
    typeof value.applicationId !== "string" ||
    typeof value.scheduledAt !== "string" ||
    typeof value.interviewType !== "string" ||
    !isReminder(value.reminder) ||
    !isOutcome(value.outcome) ||
    typeof value.companyResearch !== "string" ||
    typeof value.roleNotes !== "string" ||
    typeof value.personalNotes !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    !checklist ||
    !starStories ||
    !interviewerQuestions ||
    !technicalQuestions ||
    !behavioralQuestions
  ) {
    return null;
  }

  return {
    id: value.id,
    applicationId: value.applicationId,
    scheduledAt: value.scheduledAt,
    interviewType: value.interviewType,
    reminder: value.reminder,
    checklist,
    companyResearch: value.companyResearch,
    roleNotes: value.roleNotes,
    interviewerQuestions,
    technicalQuestions,
    behavioralQuestions,
    starStories,
    personalNotes: value.personalNotes,
    outcome: value.outcome,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function createId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function localDateTimeValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function makeMockPreparation(application: JobApplication): InterviewPreparation {
  const createdAt = application.createdAt;
  return {
    id: `prep-${application.id}`,
    applicationId: application.id,
    scheduledAt: application.interviewAt ?? new Date().toISOString(),
    interviewType: application.interviewType ?? "Video interview",
    reminder: "30",
    checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
    companyResearch:
      application.company === "Figma"
        ? "Explore how Figma brings design and product teams together. Review recent product updates and the company’s approach to collaborative design."
        : "",
    roleNotes: `${application.role} — connect your strongest relevant projects to the responsibilities in the job posting.`,
    interviewerQuestions: [
      "How does the team define success for this role in the first few months?",
      "How do design and engineering collaborate during a project?",
    ],
    technicalQuestions: [],
    behavioralQuestions: [
      "Tell me about a time you used feedback to improve your work.",
      "Describe a project where you had to balance competing priorities.",
    ],
    starStories: [
      {
        id: `star-${application.id}`,
        title: "A project you’re proud of",
        situation: "",
        task: "",
        action: "",
        result: "",
      },
    ],
    personalNotes: application.notes ?? "",
    outcome: "upcoming",
    createdAt,
    updatedAt: createdAt,
  };
}

function readStorage(): unknown {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) return null;
  try {
    return JSON.parse(stored) as unknown;
  } catch {
    throw new Error(
      "Saved interview preparation data is invalid JSON. Clear Launchpad site storage to reset it.",
    );
  }
}

export function loadInterviewPreparations(
  applications: JobApplication[],
): InterviewPreparation[] {
  const stored = readStorage();
  const applicationIds = new Set(applications.map((application) => application.id));
  if (stored === null) {
    const mockRecords = applications
      .filter((application) => Boolean(application.interviewAt))
      .map(makeMockPreparation);
    persistInterviewPreparations(mockRecords);
    return mockRecords;
  }
  if (!Array.isArray(stored)) {
    throw new Error("Saved interview preparation data is invalid. Clear Launchpad site storage to reset it.");
  }
  const migrated = stored.map(migratePreparation);
  if (migrated.some((record) => record === null)) {
    throw new Error("Saved interview preparation contains invalid records. Clear Launchpad site storage to reset it.");
  }
  const records = migrated.filter(
    (record): record is InterviewPreparation =>
      record !== null && applicationIds.has(record.applicationId),
  );
  if (records.length !== migrated.length) persistInterviewPreparations(records);
  return records;
}

export function persistInterviewPreparations(records: InterviewPreparation[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown storage error";
    throw new Error(`Could not save interview preparation to this browser: ${reason}`);
  }
}

export function createInterviewPreparation(
  current: InterviewPreparation[],
  draft: InterviewPreparationDraft,
): InterviewPreparation[] {
  const now = new Date().toISOString();
  return [
    {
      ...draft,
      id: createId(),
      checklist: draft.checklist.map((item) => ({ ...item })),
      interviewerQuestions: [...draft.interviewerQuestions],
      technicalQuestions: [...draft.technicalQuestions],
      behavioralQuestions: [...draft.behavioralQuestions],
      starStories: draft.starStories.map((story) => ({ ...story })),
      createdAt: now,
      updatedAt: now,
    },
    ...current,
  ];
}

export function updateInterviewPreparation(
  current: InterviewPreparation[],
  id: string,
  draft: InterviewPreparationDraft,
): InterviewPreparation[] {
  const record = current.find((item) => item.id === id);
  if (!record) throw new Error("This interview preparation record no longer exists.");
  return current.map((item) =>
    item.id === id
      ? {
          ...item,
          ...draft,
          id,
          createdAt: item.createdAt,
          updatedAt: new Date().toISOString(),
          checklist: draft.checklist.map((check) => ({ ...check })),
          interviewerQuestions: [...draft.interviewerQuestions],
          technicalQuestions: [...draft.technicalQuestions],
          behavioralQuestions: [...draft.behavioralQuestions],
          starStories: draft.starStories.map((story) => ({ ...story })),
        }
      : item,
  );
}

export function deleteInterviewPreparation(
  current: InterviewPreparation[],
  id: string,
): InterviewPreparation[] {
  if (!current.some((item) => item.id === id)) {
    throw new Error("This interview preparation record no longer exists.");
  }
  return current.filter((item) => item.id !== id);
}

export function makeEmptyInterviewDraft(
  application: JobApplication,
): InterviewPreparationDraft {
  return {
    applicationId: application.id,
    scheduledAt: application.interviewAt
      ? localDateTimeValue(application.interviewAt)
      : localDateTimeValue(
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ),
    interviewType: application.interviewType ?? "Video interview",
    reminder: "30",
    checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
    companyResearch: "",
    roleNotes: application.description ?? "",
    interviewerQuestions: [],
    technicalQuestions: [],
    behavioralQuestions: [],
    starStories: [
      {
        id: createId(),
        title: "A project you’re proud of",
        situation: "",
        task: "",
        action: "",
        result: "",
      },
    ],
    personalNotes: "",
    outcome: "upcoming",
  };
}
