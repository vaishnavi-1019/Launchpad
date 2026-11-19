import type { JobApplication } from "../types";
import { APPLICATION_STATUSES } from "../types";

function daysFromNow(days: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function application(
  id: string,
  company: string,
  role: string,
  status: JobApplication["status"],
  submittedDaysAgo?: number,
  interviewDaysFromNow?: number,
  interviewType?: string,
): JobApplication {
  const appliedAt =
    submittedDaysAgo === undefined ? undefined : daysFromNow(-submittedDaysAgo, 9);
  const createdAt = appliedAt ?? daysFromNow(-1);
  const statusLabel =
    APPLICATION_STATUSES.find((item) => item.value === status)?.label ?? status;

  return {
    id,
    company,
    role,
    status,
    createdAt,
    applicationDate: createdAt.slice(0, 10),
    location: interviewType === "On-site interview" ? "New York, NY" : "Remote · United States",
    workMode: interviewType === "On-site interview" ? "on-site" : "remote",
    employmentType: role.toLowerCase().includes("intern") ? "internship" : "full-time",
    tags: role.toLowerCase().includes("design system") ? ["Design systems", "Figma"] : ["Product design"],
    ...(interviewDaysFromNow !== undefined
      ? { followUpDate: daysFromNow(interviewDaysFromNow + 1).slice(0, 10) }
      : {}),
    ...(appliedAt ? { appliedAt } : {}),
    ...(interviewDaysFromNow !== undefined
      ? { contactPerson: "Recruiting team", notes: "Review the role requirements and prepare thoughtful questions." }
      : {}),
    activity: [
      {
        id: `${id}-created`,
        type: "created",
        description: "Application added to Launchpad",
        createdAt,
      },
      ...(status !== "wishlist"
        ? [
            {
              id: `${id}-status`,
              type: "status_changed" as const,
              description: `Status set to ${statusLabel}`,
              createdAt: appliedAt ?? createdAt,
            },
          ]
        : []),
      ...(interviewDaysFromNow !== undefined
        ? [
            {
              id: `${id}-notes`,
              type: "notes_updated" as const,
              description: "Interview preparation notes added",
              createdAt,
            },
            {
              id: `${id}-follow-up`,
              type: "follow_up_scheduled" as const,
              description: `Follow-up scheduled for ${daysFromNow(interviewDaysFromNow + 1).slice(0, 10)}`,
              createdAt,
            },
          ]
        : []),
    ],
    ...(interviewDaysFromNow === undefined
      ? {}
      : {
          interviewAt: daysFromNow(interviewDaysFromNow, 14),
          interviewType: interviewType ?? "Video call",
        }),
  };
}

export const initialApplications: JobApplication[] = [
  application("app-01", "Figma", "Product Designer", "interview", 2, 1, "Portfolio review"),
  application("app-02", "Notion", "Product Design Intern", "assessment", 4),
  application("app-03", "Stripe", "Associate Product Designer", "interview", 6, 3, "Video call"),
  application("app-04", "Linear", "UX Designer", "offer", 8),
  application("app-05", "Airbnb", "Experience Designer", "rejected", 10),
  application("app-06", "Shopify", "Product Designer", "wishlist"),
  application("app-07", "Webflow", "Visual Designer", "applied", 1),
  application("app-08", "Vercel", "Product Designer", "applied", 3),
  application("app-09", "Canva", "Design Systems Designer", "interview", 5, 6, "Recruiter screen"),
  application("app-10", "Slack", "Product Designer", "applied", 7),
  application("app-11", "Duolingo", "Interaction Designer", "assessment", 9),
  application("app-12", "Dropbox", "UX Designer", "applied", 11),
  application("app-13", "Airtable", "Product Designer", "applied", 13),
  application("app-14", "Asana", "Associate Product Designer", "applied", 15),
  application("app-15", "GitHub", "Product Designer", "applied", 18),
  application("app-16", "Intercom", "UX Designer", "wishlist"),
  application("app-17", "Grammarly", "Product Designer", "applied", 22),
  application("app-18", "Miro", "Product Designer", "applied", 26),
  application("app-19", "Headspace", "UX Designer", "applied", 34),
  application("app-20", "Calendly", "Product Designer", "rejected", 41),
];
