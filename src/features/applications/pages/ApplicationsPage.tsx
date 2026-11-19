import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownWideNarrow,
  BriefcaseBusiness,
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useApplications } from "../hooks/useApplications";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { ApplicationsKanban } from "../components/ApplicationsKanban";
import { ApplicationsTable } from "../components/ApplicationsTable";
import { DeleteApplicationDialog } from "../components/DeleteApplicationDialog";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type EmploymentType,
  type JobApplication,
  type WorkMode,
} from "../types";

type ViewMode = "table" | "kanban";
type SortMode = "newest" | "oldest" | "company-asc" | "company-desc";

function isSortMode(value: string): value is SortMode {
  return (
    value === "newest" ||
    value === "oldest" ||
    value === "company-asc" ||
    value === "company-desc"
  );
}

function isWorkMode(value: string): value is WorkMode {
  return value === "remote" || value === "hybrid" || value === "on-site";
}

function isEmploymentType(value: string): value is EmploymentType {
  return (
    value === "internship" ||
    value === "full-time" ||
    value === "part-time" ||
    value === "contract"
  );
}

export function ApplicationsPage() {
  const {
    applications,
    error,
    addApplication,
    editApplication,
    deleteApplication,
    moveApplication,
    dismissError,
  } = useApplications();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [workModeFilter, setWorkModeFilter] = useState<WorkMode | "all">("all");
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentType | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [deleting, setDeleting] = useState<JobApplication | null>(null);

  useEffect(() => {
    if (searchParams.get("focusSearch") !== "1") return;
    searchInputRef.current?.focus();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("focusSearch");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const filteredApplications = useMemo(() => {
    const searchTerm = query.trim().toLocaleLowerCase();
    const filtered = applications.filter((application) => {
      const matchesSearch =
        !searchTerm ||
        application.company.toLocaleLowerCase().includes(searchTerm) ||
        application.role.toLocaleLowerCase().includes(searchTerm);
      return (
        matchesSearch &&
        (statusFilter === "all" || application.status === statusFilter) &&
        (workModeFilter === "all" || application.workMode === workModeFilter) &&
        (employmentFilter === "all" || application.employmentType === employmentFilter)
      );
    });

    return filtered.sort((first, second) => {
      if (sortMode === "company-asc" || sortMode === "company-desc") {
        const order = first.company.localeCompare(second.company);
        return sortMode === "company-asc" ? order : -order;
      }
      const firstDate = Date.parse(first.applicationDate ?? first.createdAt);
      const secondDate = Date.parse(second.applicationDate ?? second.createdAt);
      return sortMode === "newest" ? secondDate - firstDate : firstDate - secondDate;
    });
  }, [applications, query, statusFilter, workModeFilter, employmentFilter, sortMode]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setWorkModeFilter("all");
    setEmploymentFilter("all");
  }

  const hasFilters =
    query.trim() !== "" ||
    statusFilter !== "all" ||
    workModeFilter !== "all" ||
    employmentFilter !== "all";

  return (
    <>
      <div className="management-page">
        <div className="management-heading">
          <div>
            <div className="welcome-date"><BriefcaseBusiness size={14} /> YOUR JOB SEARCH</div>
            <h1>Applications</h1>
            <p>Keep every opportunity organized and moving forward.</p>
          </div>
          <button
            className="button button--primary"
            onClick={() => setIsAdding(true)}
            type="button"
          >
            <Plus size={17} /> Add application
          </button>
        </div>

        {error && (
          <div className="application-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={dismissError} aria-label="Dismiss error"><X size={15} /></button>
          </div>
        )}

        <section className="management-toolbar" aria-label="Search and filter applications">
          <label className="application-search">
            <Search size={16} />
            <span className="sr-only">Search company or job title</span>
            <input
              ref={searchInputRef}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company or job title..."
              value={query}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </label>
          <div className="filter-controls">
            <label>
              <span className="sr-only">Filter by status</span>
              <select
                onChange={(event) => {
                  const selected = APPLICATION_STATUSES.find(
                    (status) => status.value === event.target.value,
                  );
                  setStatusFilter(selected?.value ?? "all");
                }}
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by work mode</span>
              <select
                onChange={(event) => {
                  const value = event.target.value;
                  setWorkModeFilter(value === "all" || isWorkMode(value) ? value : "all");
                }}
                value={workModeFilter}
              >
                <option value="all">All work modes</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
              </select>
            </label>
            <label className="employment-filter">
              <span className="sr-only">Filter by employment type</span>
              <select
                onChange={(event) => {
                  const value = event.target.value;
                  setEmploymentFilter(
                    value === "all" || isEmploymentType(value) ? value : "all",
                  );
                }}
                value={employmentFilter}
              >
                <option value="all">All employment</option>
                <option value="internship">Internship</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </label>
          </div>
        </section>

        <div className="results-toolbar">
          <span>
            Showing <strong>{filteredApplications.length}</strong> of <strong>{applications.length}</strong> applications
          </span>
          <div className="results-actions">
            <label className="sort-control">
              <ArrowDownWideNarrow size={15} />
              <span className="sr-only">Sort applications</span>
              <select
                onChange={(event) => {
                  if (isSortMode(event.target.value)) setSortMode(event.target.value);
                }}
                value={sortMode}
              >
                <option value="newest">Date: newest</option>
                <option value="oldest">Date: oldest</option>
                <option value="company-asc">Company: A–Z</option>
                <option value="company-desc">Company: Z–A</option>
              </select>
            </label>
            <div className="view-toggle" aria-label="Choose applications view">
              <button
                aria-label="Table view"
                aria-pressed={viewMode === "table"}
                className={viewMode === "table" ? "view-toggle__active" : ""}
                onClick={() => setViewMode("table")}
                type="button"
                title="Table view"
              >
                <List size={17} />
              </button>
              <button
                aria-label="Kanban view"
                aria-pressed={viewMode === "kanban"}
                className={viewMode === "kanban" ? "view-toggle__active" : ""}
                onClick={() => setViewMode("kanban")}
                type="button"
                title="Kanban view"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <section className="applications-empty content-panel">
            <div className="applications-empty__icon"><BriefcaseBusiness size={23} /></div>
            <h2>Your search starts here</h2>
            <p>Add your first opportunity and keep your applications, follow-ups, and notes together.</p>
            <button className="button button--primary" onClick={() => setIsAdding(true)} type="button">
              <Plus size={16} /> Add your first application
            </button>
          </section>
        ) : filteredApplications.length === 0 ? (
          <section className="applications-empty content-panel">
            <div className="applications-empty__icon"><Search size={22} /></div>
            <h2>No matches found</h2>
            <p>Try changing your search or filters to find an application.</p>
            {hasFilters && (
              <button className="button button--secondary" onClick={clearFilters} type="button">
                Clear filters
              </button>
            )}
          </section>
        ) : viewMode === "table" ? (
          <section className="content-panel applications-table-panel" aria-label="Applications table">
            <ApplicationsTable
              applications={filteredApplications}
              onDelete={setDeleting}
              onEdit={setEditing}
            />
          </section>
        ) : (
          <ApplicationsKanban
            applications={filteredApplications}
            onDelete={setDeleting}
            onEdit={setEditing}
            onMove={moveApplication}
          />
        )}
      </div>

      {isAdding && (
        <ApplicationFormModal onClose={() => setIsAdding(false)} onSave={addApplication} />
      )}
      {editing && (
        <ApplicationFormModal
          application={editing}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            const saved = editApplication(editing.id, draft);
            if (saved) setEditing(null);
            return saved;
          }}
        />
      )}
      {deleting && (
        <DeleteApplicationDialog
          company={deleting.company}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            if (deleteApplication(deleting.id)) setDeleting(null);
          }}
        />
      )}
    </>
  );
}
