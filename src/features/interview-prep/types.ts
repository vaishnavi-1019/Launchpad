export type InterviewOutcome =
  | "upcoming"
  | "advanced"
  | "offer"
  | "rejected"
  | "withdrew";

export type InterviewReminder = "none" | "15" | "30" | "60" | "1440";

export interface InterviewChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface StarStory {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface InterviewPreparation {
  id: string;
  applicationId: string;
  scheduledAt: string;
  interviewType: string;
  reminder: InterviewReminder;
  checklist: InterviewChecklistItem[];
  companyResearch: string;
  roleNotes: string;
  interviewerQuestions: string[];
  technicalQuestions: string[];
  behavioralQuestions: string[];
  starStories: StarStory[];
  personalNotes: string;
  outcome: InterviewOutcome;
  createdAt: string;
  updatedAt: string;
}

export type InterviewPreparationDraft = Omit<
  InterviewPreparation,
  "id" | "createdAt" | "updatedAt"
>;
