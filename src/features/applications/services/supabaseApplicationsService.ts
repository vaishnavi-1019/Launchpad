import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationInsert, ApplicationRow, Database, Json } from "@/lib/database.types";
import {
  changeApplicationStatus,
  createApplication,
  updateApplication,
} from "./applicationsService";
import type {
  ApplicationActivity,
  ApplicationDraft,
  JobApplication,
} from "../types";

function isActivity(value: unknown): value is ApplicationActivity {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" &&
    typeof item.description === "string" &&
    typeof item.createdAt === "string" &&
    (item.type === "created" ||
      item.type === "status_changed" ||
      item.type === "notes_updated" ||
      item.type === "follow_up_scheduled");
}

function rowToApplication(row: ApplicationRow): JobApplication {
  if (!Array.isArray(row.activity) || !row.activity.every(isActivity)) {
    throw new Error(`Application ${row.id} has invalid activity data.`);
  }
  const activity: ApplicationActivity[] = row.activity.map((item) => {
    if (!isActivity(item)) {
      throw new Error(`Application ${row.id} has invalid activity data.`);
    }
    return {
      id: item.id,
      type: item.type,
      description: item.description,
      createdAt: item.createdAt,
    };
  });
  return {
    id: row.id,
    ...(row.source_job_id ? { sourceJobId: row.source_job_id } : {}),
    company: row.company,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    ...(row.description ? { description: row.description } : {}),
    ...(row.website ? { website: row.website } : {}),
    ...(row.listing_url ? { listingUrl: row.listing_url } : {}),
    ...(row.location ? { location: row.location } : {}),
    ...(row.work_mode ? { workMode: row.work_mode } : {}),
    ...(row.employment_type ? { employmentType: row.employment_type } : {}),
    ...(row.salary_range ? { salaryRange: row.salary_range } : {}),
    ...(row.application_date ? { applicationDate: row.application_date } : {}),
    ...(row.applied_at ? { appliedAt: row.applied_at } : {}),
    ...(row.interview_at ? { interviewAt: row.interview_at } : {}),
    ...(row.interview_type ? { interviewType: row.interview_type } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.contact_person ? { contactPerson: row.contact_person } : {}),
    ...(row.follow_up_date ? { followUpDate: row.follow_up_date } : {}),
    tags: row.tags,
    activity,
  };
}

function applicationToInsert(
  application: JobApplication,
  userId: string,
): ApplicationInsert {
  return {
    id: application.id,
    user_id: userId,
    source_job_id: application.sourceJobId ?? null,
    company: application.company,
    role: application.role,
    description: application.description ?? null,
    website: application.website ?? null,
    listing_url: application.listingUrl ?? null,
    location: application.location ?? null,
    work_mode: application.workMode ?? null,
    employment_type: application.employmentType ?? null,
    salary_range: application.salaryRange ?? null,
    application_date: application.applicationDate?.slice(0, 10) ?? null,
    status: application.status,
    created_at: application.createdAt,
    applied_at: application.appliedAt ?? null,
    interview_at: application.interviewAt ?? null,
    interview_type: application.interviewType ?? null,
    notes: application.notes ?? null,
    contact_person: application.contactPerson ?? null,
    follow_up_date: application.followUpDate?.slice(0, 10) ?? null,
    tags: application.tags,
    activity: application.activity.map((item) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      createdAt: item.createdAt,
    })) satisfies Json,
  };
}

function readApplicationIdMap(userId: string): Record<string, string> {
  const key = `launchpad.supabase.application-id-map.v1:${userId}`;
  const stored = window.localStorage.getItem(key);
  if (stored === null) return {};

  const parsed: unknown = JSON.parse(stored);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("The saved application migration map is invalid.");
  }
  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function persistApplicationIdMap(userId: string, idMap: Record<string, string>) {
  const key = `launchpad.supabase.application-id-map.v1:${userId}`;
  try {
    window.localStorage.setItem(key, JSON.stringify(idMap));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown storage error";
    throw new Error(`Could not save the application migration map: ${reason}`);
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function importLocalApplicationsToSupabase(
  client: SupabaseClient<Database>,
  userId: string,
  applications: JobApplication[],
): Promise<{ imported: number; skipped: number }> {
  const idMap = readApplicationIdMap(userId);
  const { data: existingRows, error: existingError } = await client
    .from("applications")
    .select("id")
    .eq("user_id", userId);
  if (existingError) {
    throw new Error(`Could not check existing applications before import: ${existingError.message}`);
  }

  const existingIds = new Set(existingRows.map((row) => row.id));
  const inserts: ApplicationInsert[] = [];
  let skipped = 0;
  for (const application of applications) {
    const mappedId =
      idMap[application.id] ??
      (isUuid(application.id) ? application.id : crypto.randomUUID());
    if (existingIds.has(mappedId)) {
      idMap[application.id] = mappedId;
      skipped += 1;
      continue;
    }

    idMap[application.id] = mappedId;
    existingIds.add(mappedId);
    inserts.push(applicationToInsert({ ...application, id: mappedId }, userId));
  }

  persistApplicationIdMap(userId, idMap);
  if (inserts.length > 0) {
    const { error } = await client.from("applications").insert(inserts);
    if (error) throw new Error(`Could not import local applications: ${error.message}`);
  }
  return { imported: inserts.length, skipped };
}

export async function listApplicationsFromSupabase(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<JobApplication[]> {
  const { data, error } = await client
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load applications: ${error.message}`);
  return data.map(rowToApplication);
}

export async function createApplicationInSupabase(
  client: SupabaseClient<Database>,
  userId: string,
  draft: ApplicationDraft,
): Promise<JobApplication> {
  const application = createApplication([], draft)[0];
  const { data, error } = await client
    .from("applications")
    .insert(applicationToInsert(application, userId))
    .select("*")
    .single();
  if (error) throw new Error(`Could not add application: ${error.message}`);
  return rowToApplication(data);
}

export async function updateApplicationInSupabase(
  client: SupabaseClient<Database>,
  userId: string,
  current: JobApplication,
  draft: ApplicationDraft,
): Promise<JobApplication> {
  const updated = updateApplication([current], current.id, draft)[0];
  const { data, error } = await client
    .from("applications")
    .update(applicationToInsert(updated, userId))
    .eq("id", current.id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error(`Could not update application: ${error.message}`);
  return rowToApplication(data);
}

export async function moveApplicationInSupabase(
  client: SupabaseClient<Database>,
  userId: string,
  current: JobApplication,
  status: JobApplication["status"],
): Promise<JobApplication> {
  const updated = changeApplicationStatus([current], current.id, status)[0];
  const { data, error } = await client
    .from("applications")
    .update(applicationToInsert(updated, userId))
    .eq("id", current.id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error(`Could not change application status: ${error.message}`);
  return rowToApplication(data);
}

export async function deleteApplicationFromSupabase(
  client: SupabaseClient<Database>,
  userId: string,
  applicationId: string,
): Promise<void> {
  const { data, error } = await client
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (error) throw new Error(`Could not delete application: ${error.message}`);
  if (!data) throw new Error("Supabase did not confirm the application deletion.");
}
