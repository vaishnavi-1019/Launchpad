import { CalendarClock, CircleDot, FileText, History } from "lucide-react";
import type { ApplicationActivity, ApplicationActivityType } from "../types";

interface ApplicationTimelineProps {
  activity: ApplicationActivity[];
}

const activityIcons: Record<ApplicationActivityType, typeof CircleDot> = {
  created: CircleDot,
  status_changed: History,
  notes_updated: FileText,
  follow_up_scheduled: CalendarClock,
};

function formatActivityDate(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function ApplicationTimeline({ activity }: ApplicationTimelineProps) {
  const events = [...activity].sort(
    (first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt),
  );

  if (events.length === 0) {
    return <p className="detail-note">No activity recorded yet.</p>;
  }

  return (
    <ol className="application-timeline">
      {events.map((event) => {
        const Icon = activityIcons[event.type];
        const when = formatActivityDate(event.createdAt);
        return (
          <li className="timeline-event" key={event.id}>
            <span className={`timeline-event-icon timeline-event-icon--${event.type}`}>
              <Icon size={15} />
            </span>
            <div className="timeline-event-content">
              <p>{event.description}</p>
              <time dateTime={event.createdAt}>{when.date} · {when.time}</time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
