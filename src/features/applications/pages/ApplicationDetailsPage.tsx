import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  Clock3,
  Globe2,
  MapPin,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApplicationTimeline } from "../components/ApplicationTimeline";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { DeleteApplicationDialog } from "../components/DeleteApplicationDialog";
import { useApplications } from "../hooks/useApplications";
import { APPLICATION_STATUSES } from "../types";

function formatDate(value: string | undefined) {
  if (!value) return "Not set";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | undefined) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function safeWebLink(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function ApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    applications,
    error,
    editApplication,
    deleteApplication,
    moveApplication,
    dismissError,
  } = useApplications();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const application = applications.find((item) => item.id === id);

  if (!application) {
    return (
      <section className="content-panel detail-empty">
        <h1>Application not found</h1>
        <p>This opportunity may have been removed or the link is incorrect.</p>
        <Link className="back-link" to="/applications"><ArrowLeft size={15} /> Back to applications</Link>
      </section>
    );
  }

  const stage = APPLICATION_STATUSES.find((item) => item.value === application.status);
  const website = safeWebLink(application.website);
  const listingUrl = safeWebLink(application.listingUrl);
  const formattedWorkMode = application.workMode
    ? application.workMode === "on-site"
      ? "On-site"
      : application.workMode[0].toUpperCase() + application.workMode.slice(1)
    : "Not specified";
  const formattedEmploymentType = application.employmentType
    ? application.employmentType
        .split("-")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join("-")
    : "Not specified";

  return (
    <>
      <div className="application-details-page">
        <Link className="back-link" to="/applications">
          <ArrowLeft size={15} /> All applications
        </Link>
        {error && (
          <div className="application-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={dismissError} aria-label="Dismiss error">×</button>
          </div>
        )}
        <article className="content-panel application-detail">
          <div className="application-detail-header">
            <div className="detail-header-main">
              <div className="detail-company">
                <span className="company-logo company-logo--0">{application.company.slice(0, 1)}</span>
                <div>
                  <span className={`status-badge status-badge--${stage?.tone ?? "applied"}`}>
                    <span /> {stage?.label ?? "Applied"}
                  </span>
                  <h1>{application.role}</h1>
                  <p>{application.company}</p>
                </div>
              </div>
              <label className="detail-status-control">
                <span>Current status</span>
                <select
                  onChange={(event) => {
                    const selected = APPLICATION_STATUSES.find(
                      (status) => status.value === event.target.value,
                    );
                    if (selected) moveApplication(application.id, selected.value);
                  }}
                  value={application.status}
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="detail-actions">
              <button
                className="button button--secondary"
                onClick={() => setIsEditing(true)}
                type="button"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                className="button button--danger-outline"
                onClick={() => setIsDeleting(true)}
                type="button"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>

          <div className="detail-facts">
            <div><CalendarDays size={17} /><span>Application date<strong>{formatDate(application.applicationDate ?? application.appliedAt)}</strong></span></div>
            <div><MapPin size={17} /><span>Location<strong>{application.location || "Not specified"}</strong></span></div>
            <div><Clock3 size={17} /><span>Work arrangement<strong>{formattedWorkMode}</strong></span></div>
            <div><UserRound size={17} /><span>Employment type<strong>{formattedEmploymentType}</strong></span></div>
            <div><CalendarDays size={17} /><span>Next follow-up<strong>{formatDate(application.followUpDate)}</strong></span></div>
            {application.interviewAt && (
              <div><CalendarClock size={17} /><span>Interview<strong>{formatDateTime(application.interviewAt)}</strong></span></div>
            )}
            {application.salaryRange && (
              <div><BriefcaseBusiness size={17} /><span>Salary range<strong>{application.salaryRange}</strong></span></div>
            )}
            {application.contactPerson && (
              <div><UserRound size={17} /><span>Contact person<strong>{application.contactPerson}</strong></span></div>
            )}
          </div>

          {(website || listingUrl) && (
            <div className="detail-links">
              {website && (
                <a href={website} rel="noreferrer" target="_blank">
                  <Globe2 size={15} /> Company website <ArrowUpRight size={13} />
                </a>
              )}
              {listingUrl && (
                <a href={listingUrl} rel="noreferrer" target="_blank">
                  <BriefcaseBusiness size={15} /> Job listing <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          )}

          {application.tags.length > 0 && (
            <section className="detail-section">
              <h2>Tags</h2>
              <div className="tag-list">
                {application.tags.map((tag) => (
                  <span className="application-tag" key={tag}>{tag}</span>
                ))}
              </div>
            </section>
          )}
          <section className="detail-section">
            <h2>Job description</h2>
            <p className="detail-note">{application.description || "No job description added yet."}</p>
          </section>
          <section className="detail-section">
            <h2>Notes</h2>
            <p className="detail-note">{application.notes || "No notes added yet."}</p>
          </section>
          {application.interviewAt && (
            <section className="detail-section application-interview-summary">
              <h2>Interview preparation</h2>
              <p className="detail-note">
                {formatDateTime(application.interviewAt)}
                {application.interviewType ? ` · ${application.interviewType}` : ""}
              </p>
              <Link className="back-link" to="/interview-prep">
                Open interview workspace <ArrowUpRight size={14} />
              </Link>
            </section>
          )}
          <section className="detail-section detail-timeline-section">
            <div className="timeline-heading">
              <div>
                <h2>Activity timeline</h2>
                <p>Updates to this application, all in one place.</p>
              </div>
              <span className="timeline-event-count">{application.activity.length} events</span>
            </div>
            <ApplicationTimeline activity={application.activity} />
          </section>
        </article>
      </div>

      {isEditing && (
        <ApplicationFormModal
          application={application}
          onClose={() => setIsEditing(false)}
          onSave={(draft) => {
            const saved = editApplication(application.id, draft);
            if (saved) setIsEditing(false);
            return saved;
          }}
        />
      )}
      {isDeleting && (
        <DeleteApplicationDialog
          company={application.company}
          onCancel={() => setIsDeleting(false)}
          onConfirm={() => {
            if (deleteApplication(application.id)) {
              setIsDeleting(false);
              navigate("/applications");
            }
          }}
        />
      )}
    </>
  );
}
