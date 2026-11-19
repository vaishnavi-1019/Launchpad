import {
  BriefcaseBusiness,
  Check,
  CircleDashed,
  Clock3,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/features/applications/types";

interface StatCardProps {
  label: string;
  value: string;
  note: string;
  icon: typeof BriefcaseBusiness;
  tone: "violet" | "blue" | "amber" | "green";
}

export function StatCard({ label, value, note, icon: Icon, tone }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon--${tone}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <p className="stat-label">{label}</p>
      <div className="stat-bottom">
        <strong className="stat-value">{value}</strong>
        <span className="stat-note">{note}</span>
      </div>
    </article>
  );
}

interface PipelineOverviewProps {
  counts: Record<ApplicationStatus, number>;
}

export function PipelineOverview({ counts }: PipelineOverviewProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="pipeline">
      <div className="pipeline-total">
        <span className="pipeline-total__number">{total}</span>
        <span>tracked applications</span>
      </div>
      <div className="pipeline-bars" aria-label="Application pipeline">
        {APPLICATION_STATUSES.map(({ value: status, label, tone }) => (
          <div
            key={status}
            className={`pipeline-bar pipeline-bar--${tone}`}
            style={{ flexGrow: counts[status] || 0.15 }}
            title={`${label}: ${counts[status]}`}
            aria-label={`${label}: ${counts[status]}`}
          />
        ))}
      </div>
      <ul className="pipeline-legend">
        {APPLICATION_STATUSES.map(({ value: status, label, tone }) => (
          <li key={status}>
            <span className={`pipeline-dot pipeline-dot--${tone}`} />
            <span className="pipeline-legend__label">{label}</span>
            <strong>{counts[status]}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface WeeklyGoalProps {
  completed: number;
  target: number;
}

export function WeeklyGoal({ completed, target }: WeeklyGoalProps) {
  const progress = Math.min((completed / target) * 100, 100);
  const complete = completed >= target;

  return (
    <div className="goal-widget">
      <div className="goal-top">
        <div className="goal-icon">
          {complete ? <Trophy size={19} /> : <Target size={19} />}
        </div>
        <span className="goal-period"><Sparkles size={13} /> THIS WEEK</span>
      </div>
      <h3>{complete ? "Goal reached!" : "Keep your momentum"}</h3>
      <p>Apply to {target} jobs this week</p>
      <div
        className="goal-progress"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label="Weekly application goal progress"
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="goal-footer">
        <strong>{completed} <span>of {target} applications</span></strong>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export function EmptyInterviews() {
  return (
    <div className="empty-interviews">
      <div className="empty-interviews__icon"><Clock3 size={19} /></div>
      <p>No interviews scheduled yet</p>
      <span>They’ll show up here when you add one.</span>
    </div>
  );
}

export function ResponseHint({ count }: { count: number }) {
  if (!count) {
    return <span className="response-hint"><CircleDashed size={13} /> Waiting for your first reply</span>;
  }
  return <span className="response-hint"><MessageCircle size={13} /> {count} companies replied</span>;
}

export function SubmissionHint({ submitted }: { submitted: number }) {
  return (
    <span className="submission-hint">
      <Check size={13} /> {submitted} submitted in the last 30 days
    </span>
  );
}
