import { CalendarDays, Clock3, Video } from "lucide-react";
import type { JobApplication } from "@/features/applications/types";
import { EmptyInterviews } from "./DashboardWidgets";

interface UpcomingInterviewsProps {
  applications: JobApplication[];
}

function formatInterviewDate(value: string) {
  const date = new Date(value);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.toLocaleDateString("en-US", { day: "numeric" }),
    month: date.toLocaleDateString("en-US", { month: "short" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export function UpcomingInterviews({ applications }: UpcomingInterviewsProps) {
  const interviews = applications
    .filter(
      (application) =>
        application.status === "interview" &&
        application.interviewAt &&
        new Date(application.interviewAt) >= new Date(),
    )
    .sort((first, second) => Date.parse(first.interviewAt!) - Date.parse(second.interviewAt!))
    .slice(0, 3);

  if (!interviews.length) return <EmptyInterviews />;

  return (
    <ul className="interview-list">
      {interviews.map((application) => {
        const date = formatInterviewDate(application.interviewAt!);
        return (
          <li className="interview-item" key={application.id}>
            <div className="interview-date">
              <span>{date.weekday}</span>
              <strong>{date.day}</strong>
              <span>{date.month}</span>
            </div>
            <div className="interview-info">
              <strong>{application.company}</strong>
              <span>{application.role}</span>
              <div className="interview-meta">
                <span><Clock3 size={12} /> {date.time}</span>
                <span><Video size={12} /> {application.interviewType ?? "Interview"}</span>
              </div>
            </div>
            <CalendarDays className="interview-calendar" size={16} />
          </li>
        );
      })}
    </ul>
  );
}
