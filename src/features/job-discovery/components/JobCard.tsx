import { ArrowUpRight, Bookmark, MapPin, Sparkles } from "lucide-react";
import type { JobListing } from "../types";

interface JobCardProps {
  job: JobListing;
  saved: boolean;
  tracked: boolean;
  onSave: () => void;
  onDetails: () => void;
  onAddToTracker: () => void;
}

function postedLabel(value: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000)),
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function JobCard({
  job,
  saved,
  tracked,
  onSave,
  onDetails,
  onAddToTracker,
}: JobCardProps) {
  const companyClass = job.company.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <article className="job-card">
      <div className="job-card-top">
        <span className={`job-company-mark job-company-mark--${companyClass}`}>
          {job.company.slice(0, 1)}
        </span>
        <button
          aria-label={saved ? `Remove ${job.company} from saved jobs` : `Save ${job.company} job`}
          aria-pressed={saved}
          className={`job-save-button${saved ? " job-save-button--saved" : ""}`}
          onClick={onSave}
          title={saved ? "Remove from saved jobs" : "Save job"}
          type="button"
        >
          <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="job-company-name">{job.company}</div>
      <button className="job-title-button" onClick={onDetails} type="button">
        <h2>{job.role}</h2>
        <ArrowUpRight size={15} />
      </button>
      <div className="job-card-location"><MapPin size={13} /> {job.location}</div>
      <div className="job-badges">
        <span>{job.workMode === "on-site" ? "On-site" : job.workMode[0].toUpperCase() + job.workMode.slice(1)}</span>
        <span>{job.employmentType === "full-time" ? "Full-time" : "Internship"}</span>
        <span>{job.experienceLevel === "early-career" ? "Early career" : job.experienceLevel === "mid-level" ? "Mid-level" : "Entry level"}</span>
      </div>
      <p className="job-description">{job.description}</p>
      <div className="job-skills">
        {job.skills.slice(0, 3).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
        {job.skills.length > 3 && <span>+{job.skills.length - 3}</span>}
      </div>
      <div className="job-card-footer">
        <span className="job-posted"><Sparkles size={12} /> {postedLabel(job.postedAt)}</span>
        {tracked ? (
          <span className="job-tracked-label">In your wishlist</span>
        ) : saved ? (
          <button className="job-track-button" onClick={onAddToTracker} type="button">
            Add to tracker <ArrowUpRight size={13} />
          </button>
        ) : (
          <button className="job-details-link" onClick={onDetails} type="button">
            View details
          </button>
        )}
      </div>
    </article>
  );
}
