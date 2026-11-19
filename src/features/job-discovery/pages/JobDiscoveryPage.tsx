import { useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  Bookmark,
  BriefcaseBusiness,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useApplications } from "@/features/applications/hooks/useApplications";
import type { ApplicationDraft } from "@/features/applications/types";
import { JobCard } from "../components/JobCard";
import { JobDetailsModal } from "../components/JobDetailsModal";
import { mockJobs } from "../services/mockJobs";
import type { ExperienceLevel, JobListing } from "../types";
import type { EmploymentType, WorkMode } from "@/features/applications/types";

type JobTypeFilter = EmploymentType | "all";
type ExperienceFilter = ExperienceLevel | "all";

function isWorkMode(value: string): value is WorkMode {
  return value === "remote" || value === "hybrid" || value === "on-site";
}

function isJobType(value: string): value is EmploymentType {
  return (
    value === "internship" ||
    value === "full-time" ||
    value === "part-time" ||
    value === "contract"
  );
}

function isExperience(value: string): value is ExperienceLevel {
  return value === "entry" || value === "early-career" || value === "mid-level";
}

function jobToApplication(job: JobListing): ApplicationDraft {
  return {
    sourceJobId: job.id,
    company: job.company,
    role: job.role,
    description: job.description,
    website: job.website,
    listingUrl: job.listingUrl,
    location: job.location,
    workMode: job.workMode,
    employmentType: job.employmentType,
    salaryRange: job.salaryRange,
    applicationDate: new Date().toISOString().slice(0, 10),
    status: "wishlist",
    notes: "",
    tags: [...job.skills],
  };
}

export function JobDiscoveryPage() {
  const {
    applications,
    savedJobIds,
    error,
    toggleSavedJob,
    addJobToTracker,
    dismissError,
  } = useApplications();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [workMode, setWorkMode] = useState<WorkMode | "all">("all");
  const [jobType, setJobType] = useState<JobTypeFilter>("all");
  const [experience, setExperience] = useState<ExperienceFilter>("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [feedback, setFeedback] = useState("");

  const locations = useMemo(
    () => [...new Set(mockJobs.map((job) => job.location))].sort((a, b) => a.localeCompare(b)),
    [],
  );
  const savedSet = useMemo(() => new Set(savedJobIds), [savedJobIds]);
  const trackedSet = useMemo(
    () =>
      new Set(
        applications
          .map((application) => application.sourceJobId)
          .filter((jobId): jobId is string => Boolean(jobId)),
      ),
    [applications],
  );
  const visibleJobs = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return mockJobs
      .filter((job) => {
        const searchable = [
          job.company,
          job.role,
          job.location,
          job.description,
          ...job.skills,
        ].join(" ").toLocaleLowerCase();
        return (
          (!term || searchable.includes(term)) &&
          (location === "all" || job.location === location) &&
          (workMode === "all" || job.workMode === workMode) &&
          (jobType === "all" || job.employmentType === jobType) &&
          (experience === "all" || job.experienceLevel === experience) &&
          (!savedOnly || savedSet.has(job.id))
        );
      })
      .sort((first, second) => Date.parse(second.postedAt) - Date.parse(first.postedAt));
  }, [query, location, workMode, jobType, experience, savedOnly, savedSet]);

  function clearFilters() {
    setQuery("");
    setLocation("all");
    setWorkMode("all");
    setJobType("all");
    setExperience("all");
  }

  function saveJob(job: JobListing) {
    const saved = savedSet.has(job.id);
    if (toggleSavedJob(job.id)) {
      setFeedback(saved ? `${job.company} removed from saved jobs` : `${job.company} saved to your wishlist`);
    }
  }

  function addToTracker(job: JobListing) {
    if (addJobToTracker(job.id, jobToApplication(job))) {
      setFeedback(trackedSet.has(job.id) ? `${job.company} is already in your Applications wishlist` : `${job.company} added to your Applications wishlist`);
    }
  }

  const hasFilters =
    query.trim() !== "" ||
    location !== "all" ||
    workMode !== "all" ||
    jobType !== "all" ||
    experience !== "all";

  return (
    <>
      <div className="job-discovery-page">
        <section className="discovery-hero">
          <div className="discovery-hero-copy">
            <div className="discovery-eyebrow"><Sparkles size={14} /> YOUR NEXT CHAPTER STARTS HERE</div>
            <h1>Find work that <span>moves you.</span></h1>
            <p>Thoughtful opportunities for your next big step, all in one place.</p>
            <div className="discovery-hero-meta">
              <span><BriefcaseBusiness size={14} /> {mockJobs.length} hand-picked roles</span>
              <span><MapPin size={14} /> Across {locations.length} locations</span>
            </div>
          </div>
          <div aria-hidden="true" className="discovery-orbit">
            <span className="orbit orbit--one" />
            <span className="orbit orbit--two" />
            <span className="orbit orbit--three" />
            <span className="orbit-star orbit-star--one">✦</span>
            <span className="orbit-star orbit-star--two">✧</span>
            <span className="orbit-core"><BriefcaseBusiness size={28} /></span>
          </div>
        </section>

        {error && (
          <div className="application-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={dismissError} aria-label="Dismiss error"><X size={15} /></button>
          </div>
        )}
        {feedback && (
          <div className="discovery-feedback" role="status">
            <span>{feedback}</span>
            <button type="button" onClick={() => setFeedback("")} aria-label="Dismiss message"><X size={14} /></button>
          </div>
        )}

        <section className="discovery-controls" aria-label="Search and filter jobs">
          <label className="discovery-search">
            <Search size={17} />
            <span className="sr-only">Search jobs, companies, and skills</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search roles, companies, or skills..."
              value={query}
            />
            {query && (
              <button onClick={() => setQuery("")} type="button" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </label>
          <div className="discovery-filters">
            <label>
              <span className="sr-only">Filter by location</span>
              <select onChange={(event) => setLocation(event.target.value)} value={location}>
                <option value="all">Any location</option>
                {locations.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by work mode</span>
              <select
                onChange={(event) => {
                  const value = event.target.value;
                  setWorkMode(value === "all" || isWorkMode(value) ? value : "all");
                }}
                value={workMode}
              >
                <option value="all">Any work mode</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by job type</span>
              <select
                onChange={(event) => {
                  const value = event.target.value;
                  setJobType(value === "all" || isJobType(value) ? value : "all");
                }}
                value={jobType}
              >
                <option value="all">Any job type</option>
                <option value="internship">Internship</option>
                <option value="full-time">Full-time</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by experience level</span>
              <select
                onChange={(event) => {
                  const value = event.target.value;
                  setExperience(value === "all" || isExperience(value) ? value : "all");
                }}
                value={experience}
              >
                <option value="all">Any experience</option>
                <option value="entry">Entry level</option>
                <option value="early-career">Early career</option>
                <option value="mid-level">Mid-level</option>
              </select>
            </label>
          </div>
        </section>

        <div className="discovery-results-toolbar">
          <div className="discovery-tabs" role="group" aria-label="Choose jobs to browse">
            <button
              aria-pressed={!savedOnly}
              className={!savedOnly ? "discovery-tab discovery-tab--active" : "discovery-tab"}
              onClick={() => setSavedOnly(false)}
              type="button"
            >
              Discover <span>{mockJobs.length}</span>
            </button>
            <button
              aria-pressed={savedOnly}
              className={savedOnly ? "discovery-tab discovery-tab--active" : "discovery-tab"}
              onClick={() => setSavedOnly(true)}
              type="button"
            >
              <Bookmark size={14} /> Saved <span>{savedJobIds.length}</span>
            </button>
          </div>
          <div className="discovery-sort-label"><ArrowDownWideNarrow size={15} /> Newest first</div>
        </div>

        <div className="discovery-results-summary">
          <span><strong>{visibleJobs.length}</strong> {visibleJobs.length === 1 ? "opportunity" : "opportunities"} {savedOnly ? "saved for later" : "to explore"}</span>
          {hasFilters && (
            <button className="clear-discovery-filters" onClick={clearFilters} type="button">
              Clear filters <X size={13} />
            </button>
          )}
        </div>

        {visibleJobs.length === 0 ? (
          <section className="discovery-empty">
            <div className="discovery-empty-icon">
              {savedOnly ? <Bookmark size={22} /> : <Search size={22} />}
            </div>
            <h2>{savedOnly ? "No saved jobs yet" : "No jobs match those filters"}</h2>
            <p>
              {savedOnly
                ? "Save a role that catches your eye and it’ll be waiting here."
                : "Try a broader search or clear a filter to see more opportunities."}
            </p>
            {hasFilters && (
              <button className="button button--secondary" onClick={clearFilters} type="button">
                Clear filters
              </button>
            )}
          </section>
        ) : (
          <section className="job-grid" aria-label={savedOnly ? "Saved jobs" : "Job listings"}>
            {visibleJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                saved={savedSet.has(job.id)}
                tracked={trackedSet.has(job.id)}
                onSave={() => saveJob(job)}
                onDetails={() => setSelectedJob(job)}
                onAddToTracker={() => addToTracker(job)}
              />
            ))}
          </section>
        )}
      </div>

      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          saved={savedSet.has(selectedJob.id)}
          tracked={trackedSet.has(selectedJob.id)}
          onClose={() => setSelectedJob(null)}
          onSave={() => saveJob(selectedJob)}
          onAddToTracker={() => addToTracker(selectedJob)}
        />
      )}
    </>
  );
}
