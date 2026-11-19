import { useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  MessageCircle,
  Plus,
  Trophy,
  X,
} from "lucide-react";
import type { ApplicationStatus } from "@/features/applications/types";
import { useApplications } from "@/features/applications/hooks/useApplications";
import { ActivityChart } from "../components/ActivityChart";
import {
  PipelineOverview,
  ResponseHint,
  StatCard,
  SubmissionHint,
  WeeklyGoal,
} from "../components/DashboardWidgets";
import { RecentApplications } from "../components/RecentApplications";
import { UpcomingInterviews } from "../components/UpcomingInterviews";
import { ApplicationFormModal } from "@/features/applications/components/ApplicationFormModal";

const responseStatuses: ApplicationStatus[] = ["assessment", "interview", "offer", "rejected"];
const weeklyGoal = 5;

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function isSameMonth(value: string, date: Date) {
  const submittedAt = new Date(value);
  return (
    submittedAt.getMonth() === date.getMonth() &&
    submittedAt.getFullYear() === date.getFullYear()
  );
}

function isThisWeek(value: string, today: Date) {
  const submittedAt = new Date(value);
  const weekStart = new Date(today);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
  return submittedAt >= weekStart && submittedAt <= endOfToday;
}

export function DashboardPage() {
  const { applications, addApplication, error, dismissError } = useApplications();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const today = new Date();
  const submitted = applications.filter((application) => application.appliedAt);
  const responded = applications.filter(
    (application) => application.appliedAt && responseStatuses.includes(application.status),
  );
  const responseRate = submitted.length
    ? Math.round((responded.length / submitted.length) * 100)
    : 0;
  const interviews = applications.filter((application) => application.status === "interview");
  const upcomingInterviewCount = applications.filter(
    (application) =>
      application.status === "interview" &&
      application.interviewAt &&
      new Date(application.interviewAt) >= today,
  ).length;
  const thisMonth = submitted.filter(
    (application) => application.appliedAt && isSameMonth(application.appliedAt, today),
  ).length;
  const weeklyApplications = submitted.filter(
    (application) => application.appliedAt && isThisWeek(application.appliedAt, today),
  ).length;
  const chartStart = new Date(today);
  chartStart.setDate(chartStart.getDate() - 29);
  chartStart.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const recentSubmissions = submitted.filter((application) => {
    if (!application.appliedAt) return false;
    const appliedAt = new Date(application.appliedAt);
    return appliedAt >= chartStart && appliedAt <= endOfToday;
  }).length;
  const pipelineCounts = applications.reduce<Record<ApplicationStatus, number>>(
    (counts, application) => {
      counts[application.status] += 1;
      return counts;
    },
    {
      wishlist: 0,
      applied: 0,
      assessment: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    },
  );
  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <div className="dashboard-page">
        {error && (
          <div className="application-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={dismissError} aria-label="Dismiss error"><X size={15} /></button>
          </div>
        )}
        <section className="welcome-section">
          <div className="welcome-copy">
            <div className="welcome-date"><CalendarDays size={14} /> {todayLabel}</div>
            <h1>{getGreeting(today.getHours())}, Alex <span>✦</span></h1>
            <p>A little progress every day adds up. Let’s make this one count.</p>
          </div>
          <button
            className="button button--primary add-application-button"
            onClick={() => setIsAddModalOpen(true)}
            type="button"
          >
            <Plus size={17} /> Add application
          </button>
        </section>

        <section className="stats-grid" aria-label="Application statistics">
          <StatCard
            label="Total applications"
            value={String(applications.length)}
            note={`+${thisMonth} this month`}
            icon={BriefcaseBusiness}
            tone="violet"
          />
          <StatCard
            label="Response rate"
            value={`${responseRate}%`}
            note={`${responded.length} companies replied`}
            icon={MessageCircle}
            tone="blue"
          />
          <StatCard
            label="Interviews"
            value={String(interviews.length)}
            note={`${upcomingInterviewCount} coming up`}
            icon={CalendarCheck2}
            tone="amber"
          />
          <StatCard
            label="Offers"
            value={String(pipelineCounts.offer)}
            note="You’re making progress"
            icon={Trophy}
            tone="green"
          />
        </section>

        <section className="dashboard-grid dashboard-grid--main">
          <article className="content-panel activity-panel" id="activity">
            <div className="section-heading">
              <div>
                <h2>Application activity</h2>
                <p>Your application pace over the last 30 days</p>
              </div>
              <span className="period-pill">Last 30 days <ArrowUpRight size={13} /></span>
            </div>
            <ActivityChart applications={applications} />
            <div className="chart-footer">
              <SubmissionHint submitted={recentSubmissions} />
            </div>
          </article>

          <article className="content-panel pipeline-panel" id="pipeline">
            <div className="section-heading">
              <div>
                <h2>Application pipeline</h2>
                <p>See where every opportunity stands</p>
              </div>
              <span className="section-icon"><BriefcaseBusiness size={17} /></span>
            </div>
            <PipelineOverview counts={pipelineCounts} />
          </article>
        </section>

        <section className="dashboard-grid dashboard-grid--secondary">
          <article className="content-panel interviews-panel" id="upcoming-interviews">
            <div className="section-heading">
              <div>
                <h2>Upcoming interviews</h2>
                <p>Make a great impression</p>
              </div>
              {upcomingInterviewCount > 0 && (
                <span className="count-pill">{upcomingInterviewCount} upcoming</span>
              )}
            </div>
            <UpcomingInterviews applications={applications} />
          </article>

          <article className="content-panel goal-panel" id="weekly-goal">
            <WeeklyGoal completed={weeklyApplications} target={weeklyGoal} />
          </article>
        </section>

        <section className="content-panel recent-panel" id="recent-applications">
          <div className="section-heading">
            <div>
              <h2>Recent applications</h2>
              <p>Your latest opportunities in one place</p>
            </div>
            <span className="recent-count">{Math.min(5, applications.length)} shown</span>
          </div>
          <RecentApplications applications={applications} />
          <ResponseHint count={responded.length} />
        </section>
      </div>

      {isAddModalOpen && (
        <ApplicationFormModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={addApplication}
        />
      )}
    </>
  );
}
