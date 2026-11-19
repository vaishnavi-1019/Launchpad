export const APPLICATION_STATUSES = [
  { value: "wishlist", label: "Wishlist", tone: "wishlist" },
  { value: "applied", label: "Applied", tone: "applied" },
  { value: "assessment", label: "Assessment", tone: "assessment" },
  { value: "interview", label: "Interview", tone: "interview" },
  { value: "offer", label: "Offer", tone: "offer" },
  { value: "rejected", label: "Rejected", tone: "rejected" },
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]["value"];
export type WorkMode = "remote" | "hybrid" | "on-site";
export type EmploymentType = "internship" | "full-time" | "part-time" | "contract";
export type ApplicationActivityType =
  | "created"
  | "status_changed"
  | "notes_updated"
  | "follow_up_scheduled";

export interface ApplicationActivity {
  id: string;
  type: ApplicationActivityType;
  description: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  sourceJobId?: string;
  company: string;
  role: string;
  description?: string;
  website?: string;
  listingUrl?: string;
  location?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  salaryRange?: string;
  applicationDate?: string;
  status: ApplicationStatus;
  createdAt: string;
  appliedAt?: string;
  interviewAt?: string;
  interviewType?: string;
  notes?: string;
  contactPerson?: string;
  followUpDate?: string;
  tags: string[];
  activity: ApplicationActivity[];
}

export type ApplicationDraft = Omit<JobApplication, "id" | "createdAt" | "activity">;
