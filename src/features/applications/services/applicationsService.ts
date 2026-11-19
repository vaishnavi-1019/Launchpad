import {
  APPLICATION_STATUSES,
  type ApplicationActivity,
  type ApplicationActivityType,
  type ApplicationDraft,
  type ApplicationStatus,
  type EmploymentType,
  type JobApplication,
  type WorkMode,
} from "../types";
import { initialApplications } from "./mockApplications";

const STORAGE_KEY = "launchpad.applications.v1";
const WORK_MODES: WorkMode[] = ["remote", "hybrid", "on-site"];
const EMPLOYMENT_TYPES: EmploymentType[] = ["internship", "full-time", "part-time", "contract"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return APPLICATION_STATUSES.some((status) => status.value === value);
}

function isWorkMode(value: unknown): value is WorkMode {
  return WORK_MODES.some((mode) => mode === value);
}

function isEmploymentType(value: unknown): value is EmploymentType {
  return EMPLOYMENT_TYPES.some((type) => type === value);
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function statusLabel(status: ApplicationStatus) {
  return APPLICATION_STATUSES.find((item) => item.value === status)?.label ?? status;
}

function createActivity(
  type: ApplicationActivityType,
  description: string,
  createdAt = new Date().toISOString(),
): ApplicationActivity {
  return {
    id: createApplicationId(),
    type,
    description,
    createdAt,
  };
}

function migrateActivity(value: unknown): ApplicationActivity | null {
  if (!isRecord(value)) return null;
  const { id, type, description, createdAt } = value;
  if (
    typeof id !== "string" ||
    (type !== "created" &&
      type !== "status_changed" &&
      type !== "notes_updated" &&
      type !== "follow_up_scheduled") ||
    typeof description !== "string" ||
    typeof createdAt !== "string"
  ) {
    return null;
  }
  return { id, type, description, createdAt };
}

function migrateApplication(value: unknown): JobApplication | null {
  if (!isRecord(value)) return null;
  const { id, company, role, status } = value;
  if (
    typeof id !== "string" ||
    typeof company !== "string" ||
    typeof role !== "string" ||
    !isApplicationStatus(status)
  ) {
    return null;
  }

  const createdAt =
    typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString();
  const appliedAt = optionalString(value.appliedAt);
  const applicationDate =
    optionalString(value.applicationDate) ??
    appliedAt?.slice(0, 10) ??
    createdAt.slice(0, 10);
  const tags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const workMode = isWorkMode(value.workMode) ? value.workMode : undefined;
  const employmentType = isEmploymentType(value.employmentType)
    ? value.employmentType
    : undefined;
  const description = optionalString(value.description);
  const website = optionalString(value.website);
  const listingUrl = optionalString(value.listingUrl);
  const location = optionalString(value.location);
  const salaryRange = optionalString(value.salaryRange);
  const interviewAt = optionalString(value.interviewAt);
  const interviewType = optionalString(value.interviewType);
  const notes = optionalString(value.notes);
  const contactPerson = optionalString(value.contactPerson);
  const followUpDate = optionalString(value.followUpDate);
  const activities = Array.isArray(value.activity)
    ? value.activity.map(migrateActivity)
    : [];
  if (activities.some((activity) => activity === null)) return null;
  const activity: ApplicationActivity[] = activities.filter(
    (item): item is ApplicationActivity => item !== null,
  );
  if (activity.length === 0) {
    activity.push(
      createActivity("created", "Application added to Launchpad", createdAt),
    );
    if (status !== "wishlist") {
      activity.push(
        createActivity(
          "status_changed",
          `Status changed to ${statusLabel(status)}`,
          appliedAt ?? createdAt,
        ),
      );
    }
    if (notes) {
      activity.push(createActivity("notes_updated", "Notes added", createdAt));
    }
    if (followUpDate) {
      activity.push(
        createActivity(
          "follow_up_scheduled",
          `Follow-up scheduled for ${followUpDate}`,
          createdAt,
        ),
      );
    }
  }

  return {
    id,
    ...(optionalString(value.sourceJobId)
      ? { sourceJobId: optionalString(value.sourceJobId) }
      : {}),
    company,
    role,
    status,
    createdAt,
    applicationDate,
    tags,
    activity,
    ...(appliedAt ? { appliedAt } : {}),
    ...(description ? { description } : {}),
    ...(website ? { website } : {}),
    ...(listingUrl ? { listingUrl } : {}),
    ...(location ? { location } : {}),
    ...(workMode ? { workMode } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(salaryRange ? { salaryRange } : {}),
    ...(interviewAt ? { interviewAt } : {}),
    ...(interviewType ? { interviewType } : {}),
    ...(notes ? { notes } : {}),
    ...(contactPerson ? { contactPerson } : {}),
    ...(followUpDate ? { followUpDate } : {}),
  };
}

function readStoredApplications(): JobApplication[] | null {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) return null;

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) {
    throw new Error("Saved applications data is invalid. Clear Launchpad site storage to reset it.");
  }

  const migrated = parsed.map(migrateApplication);
  if (migrated.some((application) => application === null)) {
    throw new Error("Saved applications contain invalid records. Clear Launchpad site storage to reset it.");
  }
  return migrated.filter(
    (application): application is JobApplication => application !== null,
  );
}

export function loadApplications(): JobApplication[] {
  const stored = readStoredApplications();
  const applications = stored ?? initialApplications;
  persistApplications(applications);
  return applications;
}

export function persistApplications(applications: JobApplication[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown storage error";
    throw new Error(`Could not save applications to this browser: ${reason}`);
  }
}

function createApplicationId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createApplication(
  current: JobApplication[],
  draft: ApplicationDraft,
): JobApplication[] {
  const application: JobApplication = {
    ...draft,
    id: createApplicationId(),
    createdAt: new Date().toISOString(),
    tags: [...draft.tags],
    activity: [
      createActivity("created", "Application added to Launchpad"),
      ...(draft.status === "wishlist"
        ? []
        : [createActivity("status_changed", `Status changed to ${statusLabel(draft.status)}`)]),
      ...(draft.notes
        ? [createActivity("notes_updated", "Notes added")]
        : []),
      ...(draft.followUpDate
        ? [
            createActivity(
              "follow_up_scheduled",
              `Follow-up scheduled for ${draft.followUpDate}`,
            ),
          ]
        : []),
    ],
  };
  return [application, ...current];
}

export function updateApplication(
  current: JobApplication[],
  id: string,
  draft: ApplicationDraft,
): JobApplication[] {
  if (!current.some((application) => application.id === id)) {
    throw new Error("This application no longer exists.");
  }
  return current.map((application) => {
    if (application.id !== id) return application;
    const activity = [...application.activity];
    if (application.status !== draft.status) {
      activity.push(
        createActivity(
          "status_changed",
          `Status changed from ${statusLabel(application.status)} to ${statusLabel(draft.status)}`,
        ),
      );
    }
    if ((application.notes ?? "") !== (draft.notes ?? "")) {
      activity.push(createActivity("notes_updated", "Notes updated"));
    }
    if ((application.followUpDate ?? "") !== (draft.followUpDate ?? "") && draft.followUpDate) {
      activity.push(
        createActivity(
          "follow_up_scheduled",
          `Follow-up scheduled for ${draft.followUpDate}`,
        ),
      );
    }
    return {
      ...application,
      ...draft,
      id,
      createdAt: application.createdAt,
      tags: [...draft.tags],
      activity,
    };
  });
}

export function removeApplication(current: JobApplication[], id: string): JobApplication[] {
  if (!current.some((application) => application.id === id)) {
    throw new Error("This application no longer exists.");
  }
  return current.filter((application) => application.id !== id);
}

export function changeApplicationStatus(
  current: JobApplication[],
  id: string,
  status: ApplicationStatus,
): JobApplication[] {
  const application = current.find((item) => item.id === id);
  if (!application) throw new Error("This application no longer exists.");
  const isSubmitted = status !== "wishlist";
  const applicationDate =
    isSubmitted && !application.appliedAt
      ? new Date().toISOString()
      : application.appliedAt;
  return current.map((item) =>
    item.id === id
      ? {
          ...item,
          status,
          activity: [
            ...item.activity,
            createActivity(
              "status_changed",
              `Status changed from ${statusLabel(item.status)} to ${statusLabel(status)}`,
            ),
          ],
          ...(isSubmitted
            ? {
                applicationDate: item.applicationDate ?? applicationDate?.slice(0, 10),
                appliedAt: applicationDate,
              }
            : { appliedAt: undefined }),
        }
      : item,
  );
}
