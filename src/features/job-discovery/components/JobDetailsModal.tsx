import {
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ExternalLink,
  MapPin,
  X,
} from "lucide-react";
import { useModalFocus } from "@/hooks/useModalFocus";
import type { JobListing } from "../types";

interface JobDetailsModalProps {
  job: JobListing;
  saved: boolean;
  tracked: boolean;
  onClose: () => void;
  onSave: () => void;
  onAddToTracker: () => void;
}

function postedLabel(value: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000)),
  );
  return days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"} ago`;
}

export function JobDetailsModal({
  job,
  saved,
  tracked,
  onClose,
  onSave,
  onAddToTracker,
}: JobDetailsModalProps) {
  const companyClass = job.company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const dialogRef = useModalFocus<HTMLElement>();

  return (
    <div
      className="modal-backdrop job-details-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="job-details-title"
        aria-modal="true"
        className="job-details-modal"
        ref={dialogRef}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        role="dialog"
      >
        <button
          aria-label="Close job details"
          className="icon-button job-details-close"
          onClick={onClose}
          type="button"
        >
          <X size={18} />
        </button>
        <header className="job-details-header">
          <span className={`job-company-mark job-company-mark--${companyClass}`}>
            {job.company.slice(0, 1)}
          </span>
          <div className="job-details-heading">
            <span className="job-company-name">{job.company}</span>
            <h2 id="job-details-title">{job.role}</h2>
            <span className="job-card-location"><MapPin size={13} /> {job.location}</span>
          </div>
        </header>
        <div className="job-details-meta">
          <span>{job.workMode === "on-site" ? "On-site" : job.workMode[0].toUpperCase() + job.workMode.slice(1)}</span>
          <span>{job.employmentType === "full-time" ? "Full-time" : "Internship"}</span>
          <span>{job.experienceLevel === "early-career" ? "Early career" : job.experienceLevel === "mid-level" ? "Mid-level" : "Entry level"}</span>
          <span><CalendarDays size={12} /> Posted {postedLabel(job.postedAt)}</span>
        </div>
        {job.salaryRange && <div className="job-salary">{job.salaryRange}</div>}
        <div className="job-details-scroll">
          <section>
            <h3>About the role</h3>
            <p>{job.description}</p>
          </section>
          <section>
            <h3>What you’ll bring</h3>
            <div className="job-skills job-skills--details">
              {job.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          </section>
          <section className="job-details-facts">
            <div><BriefcaseBusiness size={15} /><span>Experience<strong>{job.experienceLevel === "early-career" ? "Early career" : job.experienceLevel === "mid-level" ? "Mid-level" : "Entry level"}</strong></span></div>
            <div><MapPin size={15} /><span>Location<strong>{job.location}</strong></span></div>
          </section>
          <a className="job-external-link" href={job.website} rel="noreferrer" target="_blank">
            <ExternalLink size={14} /> Visit {job.company} <ArrowUpRight size={13} />
          </a>
        </div>
        <footer className="job-details-actions">
          <button
            className={`button ${saved ? "button--secondary" : "button--secondary"}`}
            onClick={onSave}
            type="button"
          >
            {saved ? <Check size={15} /> : <Bookmark size={15} />}
            {saved ? "Saved" : "Save job"}
          </button>
          {tracked ? (
            <button className="button button--primary" disabled type="button">
              <Check size={15} /> Added to wishlist
            </button>
          ) : saved ? (
            <button className="button button--primary" onClick={onAddToTracker} type="button">
              Add to application tracker <ArrowUpRight size={14} />
            </button>
          ) : (
            <a className="button button--primary" href={job.listingUrl} rel="noreferrer" target="_blank">
              View listing <ArrowUpRight size={14} />
            </a>
          )}
        </footer>
      </section>
    </div>
  );
}
