import type { EmploymentType, WorkMode } from "@/features/applications/types";

export type ExperienceLevel = "entry" | "early-career" | "mid-level";

export interface JobListing {
  id: string;
  company: string;
  role: string;
  location: string;
  workMode: WorkMode;
  employmentType: Extract<EmploymentType, "internship" | "full-time">;
  experienceLevel: ExperienceLevel;
  postedAt: string;
  description: string;
  skills: string[];
  salaryRange?: string;
  website: string;
  listingUrl: string;
}
