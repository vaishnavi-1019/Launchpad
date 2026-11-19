import { createContext } from "react";
import type { ApplicationDraft, ApplicationStatus, JobApplication } from "./types";
import type {
  InterviewPreparation,
  InterviewPreparationDraft,
} from "@/features/interview-prep/types";

export interface ApplicationsContextValue {
  applications: JobApplication[];
  interviewPreparations: InterviewPreparation[];
  savedJobIds: string[];
  error: string | null;
  addApplication: (draft: ApplicationDraft) => boolean;
  editApplication: (id: string, draft: ApplicationDraft) => boolean;
  deleteApplication: (id: string) => boolean;
  moveApplication: (id: string, status: ApplicationStatus) => void;
  toggleSavedJob: (jobId: string) => boolean;
  addJobToTracker: (jobId: string, draft: ApplicationDraft) => boolean;
  addInterviewPreparation: (draft: InterviewPreparationDraft) => string | null;
  editInterviewPreparation: (
    id: string,
    draft: InterviewPreparationDraft,
  ) => boolean;
  deleteInterviewPreparation: (id: string) => boolean;
  dismissError: () => void;
}

export const ApplicationsContext = createContext<ApplicationsContextValue | null>(null);
