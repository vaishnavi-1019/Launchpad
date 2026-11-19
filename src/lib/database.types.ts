export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "assessment"
  | "interview"
  | "offer"
  | "rejected";

export type ApplicationRow = {
  id: string;
  user_id: string;
  source_job_id: string | null;
  company: string;
  role: string;
  description: string | null;
  website: string | null;
  listing_url: string | null;
  location: string | null;
  work_mode: "remote" | "hybrid" | "on-site" | null;
  employment_type: "internship" | "full-time" | "part-time" | "contract" | null;
  salary_range: string | null;
  application_date: string | null;
  status: ApplicationStatus;
  created_at: string;
  applied_at: string | null;
  interview_at: string | null;
  interview_type: string | null;
  notes: string | null;
  contact_person: string | null;
  follow_up_date: string | null;
  tags: string[];
  activity: Json;
};

export type ApplicationInsert = {
  id?: string;
  user_id: string;
  source_job_id?: string | null;
  company: string;
  role: string;
  description?: string | null;
  website?: string | null;
  listing_url?: string | null;
  location?: string | null;
  work_mode?: ApplicationRow["work_mode"];
  employment_type?: ApplicationRow["employment_type"];
  salary_range?: string | null;
  application_date?: string | null;
  status?: ApplicationStatus;
  created_at?: string;
  applied_at?: string | null;
  interview_at?: string | null;
  interview_type?: string | null;
  notes?: string | null;
  contact_person?: string | null;
  follow_up_date?: string | null;
  tags?: string[];
  activity?: Json;
};

export type ProfileRow = {
  id: string;
  display_name: string;
  target_role: string;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  display_name?: string;
  target_role?: string;
  created_at?: string;
  updated_at?: string;
};

type Table<
  Row extends Record<string, unknown>,
  Insert extends Record<string, unknown>,
  Update extends Record<string, unknown>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, ProfileInsert, Partial<ProfileInsert>>;
      applications: Table<ApplicationRow, ApplicationInsert, Partial<ApplicationInsert>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
